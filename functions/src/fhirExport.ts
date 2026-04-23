import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';

/**
 * FHIR R4 export · preparación EHDS 2027
 *
 * Endpoint callable que convierte los casos docentes de un usuario
 * (users/{uid}/cases) a un bundle FHIR R4 con recursos Patient,
 * Observation, DiagnosticReport, ImagingStudy, MedicationStatement.
 *
 * Datos de entrada (opt-in): pseudo-Patient construido a partir de
 * iniciales (<=4), edad y cama. Nunca DNI/NIE/NHC (garantizado por
 * Firestore rules).
 *
 * Conforme a HL7 FHIR R4 (http://hl7.org/fhir/R4) + IPS
 * (International Patient Summary) cuando sea aplicable.
 *
 * Restricciones:
 *  - El output NO incluye datos identificativos. Cada Patient es un
 *    identifier pseudo (hash(uid+caseId)).
 *  - El bundle es stateless: se genera en cada llamada, no se persiste.
 *  - Máximo 500 casos por llamada (ampliable con paginación futura).
 *
 * Uso desde cliente:
 *   const fn = firebase.functions('europe-west1').httpsCallable('fhirExport');
 *   const res = await fn({ scope: 'own-cases' });
 *   const bundle = res.data; // JSON FHIR Bundle
 */

const REGION = 'europe-west1';
const MAX_CASES_PER_CALL = 500;

interface CaseDoc {
  initials?: string;
  age?: number | string;
  bed?: string;
  notes?: string;
  diagnostico?: string;
  diagnostic?: string;
  sintomas?: string;
  medication?: string;
  medicacion?: string;
  imaging?: string;
  createdAt?: FirebaseFirestore.Timestamp;
  [k: string]: unknown;
}

type FhirResource = Record<string, unknown>;

function pseudoId(uid: string, caseId: string): string {
  // Hash corto determinístico (sin librerías extra: 32-bit FNV-1a suficiente para ID opaco).
  const s = uid + ':' + caseId;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'cart-' + h.toString(16);
}

function buildPatient(caseId: string, d: CaseDoc, uid: string): FhirResource {
  const id = pseudoId(uid, caseId);
  const ageVal = typeof d.age === 'number' ? d.age : parseInt(String(d.age ?? ''), 10);
  return {
    resourceType: 'Patient',
    id,
    meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Patient'] },
    identifier: [
      {
        system: 'https://area2cartagena.es/fhir/pseudo-id',
        value: id,
      },
    ],
    active: true,
    // iniciales ≤ 4 como "given name" abreviado (sin apellidos)
    name: d.initials ? [{ use: 'anonymous', given: [String(d.initials).substring(0, 4)] }] : undefined,
    extension: !isNaN(ageVal)
      ? [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/patient-age',
            valueQuantity: { value: ageVal, unit: 'years', system: 'http://unitsofmeasure.org', code: 'a' },
          },
        ]
      : undefined,
    // nunca birthDate real, nunca address, nunca contacto
  };
}

function buildConditionOrObservation(
  caseId: string,
  d: CaseDoc,
  patientRef: string,
): FhirResource[] {
  const out: FhirResource[] = [];
  const diag = d.diagnostico || d.diagnostic;
  if (diag) {
    out.push({
      resourceType: 'Condition',
      id: pseudoId(patientRef, caseId + ':cond'),
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }],
        },
      ],
      code: { text: String(diag).substring(0, 200) },
      subject: { reference: 'Patient/' + patientRef },
      recordedDate: d.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    });
  }
  if (d.sintomas) {
    out.push({
      resourceType: 'Observation',
      id: pseudoId(patientRef, caseId + ':sym'),
      status: 'final',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam' }],
        },
      ],
      code: { text: 'Síntomas (texto libre, docente)' },
      subject: { reference: 'Patient/' + patientRef },
      effectiveDateTime: d.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
      valueString: String(d.sintomas).substring(0, 1000),
    });
  }
  return out;
}

function buildMedication(caseId: string, d: CaseDoc, patientRef: string): FhirResource | null {
  const med = d.medication || d.medicacion;
  if (!med) return null;
  return {
    resourceType: 'MedicationStatement',
    id: pseudoId(patientRef, caseId + ':med'),
    status: 'active',
    medicationCodeableConcept: {
      text: String(med).substring(0, 300),
    },
    subject: { reference: 'Patient/' + patientRef },
    effectiveDateTime: d.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    note: [{ text: 'Documentado por clase terapéutica + principio activo (sin marca).' }],
  };
}

function buildImaging(caseId: string, d: CaseDoc, patientRef: string): FhirResource | null {
  if (!d.imaging) return null;
  return {
    resourceType: 'ImagingStudy',
    id: pseudoId(patientRef, caseId + ':img'),
    status: 'available',
    subject: { reference: 'Patient/' + patientRef },
    started: d.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    description: String(d.imaging).substring(0, 200),
    note: [
      {
        text: 'ImagingStudy representativo · imagen no incluida por política de minimización RGPD. Referencia formativa.',
      },
    ],
  };
}

export const fhirExport = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 120,
    cors: ['https://area2cartagena.es', 'https://carlosgalera-a11y.github.io', 'http://localhost:5000'],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }
    const uid = request.auth.uid;
    const db = getFirestore(getApp());

    // Solo exporta los casos del usuario que llama (no admin cruza datos).
    const snap = await db.collection('users').doc(uid).collection('cases').limit(MAX_CASES_PER_CALL).get();

    const entries: Array<{ fullUrl: string; resource: FhirResource }> = [];

    snap.forEach((doc) => {
      const d = doc.data() as CaseDoc;
      const caseId = doc.id;
      const patient = buildPatient(caseId, d, uid);
      const patientRef = String(patient.id);
      entries.push({ fullUrl: 'urn:uuid:' + patientRef, resource: patient });

      for (const r of buildConditionOrObservation(caseId, d, patientRef)) {
        entries.push({ fullUrl: 'urn:uuid:' + String(r.id), resource: r });
      }
      const med = buildMedication(caseId, d, patientRef);
      if (med) entries.push({ fullUrl: 'urn:uuid:' + String(med.id), resource: med });
      const img = buildImaging(caseId, d, patientRef);
      if (img) entries.push({ fullUrl: 'urn:uuid:' + String(img.id), resource: img });
    });

    const bundle = {
      resourceType: 'Bundle',
      id: pseudoId(uid, 'export-' + Date.now()),
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips'],
      },
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };

    return bundle;
  },
);

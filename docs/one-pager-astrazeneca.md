# Cartagenaeste · one-pager para Medical Affairs

**Plataforma formativa para profesionales sanitarios y pacientes · Área II Cartagena**
https://area2cartagena.es · Reg. PI 00765-03096622

---

## 🩺 Qué es

Cartagenaeste es una **plataforma formativa y organizador personal de guardia** dirigida a profesionales sanitarios (medicina, enfermería) y pacientes. Está en **uso clínico activo** en la Unidad de Urgencias del Hospital General Universitario Santa Lucía (Área II Cartagena · Servicio Murciano de Salud).

Combina contenido formativo curado, protocolos institucionales indexados, calculadoras clínicas validadas, vademécum contextualizado y herramientas asistidas por IA con **supervisión humana obligatoria** (EU AI Act art. 14).

---

## 👤 Autoría y titularidad

- **Autor único:** Carlos Galera Román · Licenciado en Medicina · MIR R4 MFyC.
- **Centro formador:** HGU Santa Lucía · Área II Cartagena · SMS.
- **Registro Propiedad Intelectual:** **00765-03096622** · Art. 51 LPI.
- Fin de residencia: 30 de mayo de 2026.

---

## 📐 Arquitectura y cumplimiento

| Capa | Proveedor | Región |
|---|---|---|
| Frontend PWA | GitHub Pages · `area2cartagena.es` | Global CDN |
| Backend | Firebase (Auth, Firestore, Functions, Storage) | **europe-west1 (Bélgica)** |
| Cadena IA | Qwen 2.5-VL-72B · DeepSeek V3 · Gemini · Mistral · OpenRouter | UE preferente |
| App Check | Firebase enforce activo | — |
| Observabilidad | Sentry + GA4 anonymize_ip + logs TTL 6-12m | UE |

### Cumplimiento regulatorio

- ✅ RGPD (UE) 2016/679 + LOPDGDD 3/2018
- ✅ EU AI Act 2024/1689 · arts. 9 · 10 · 11 · 12 · 13 · 14 · 15
- ✅ EHDS (UE) 2025/327 · preparado para 2027
- ✅ Ley 41/2002 · autonomía del paciente
- ✅ Dossier técnico completo disponible a petición

### Seudonimización

- Máximo 4 iniciales + edad + número de cama. **Nunca DNI/NIE/NHC**.
- Rules Firestore bloquean activamente DNI/NIE (`noDni()`).
- OCR cliente-lado bloquea envío de imagen con PII a la IA (Tesseract.js).
- Logs no almacenan contenido de prompts ni respuestas, solo metadatos.

---

## 🤝 Relación potencial con AstraZeneca

**Modelo único viable:** patrocinio educativo independiente vía **Medical Affairs**.

Alineado con:
- Código de Buenas Prácticas de la Industria Farmacéutica (Farmaindustria).
- EFPIA Disclosure Code.

**Condiciones no negociables por parte del proyecto:**

1. Interlocución con Medical Affairs, nunca con Comercial.
2. Independencia editorial total · línea editorial bajo control del autor.
3. Sin marcas comerciales en el contenido (siempre clase terapéutica + principio activo).
4. Sin revisión previa ni aprobación de contenidos por parte del patrocinador.
5. Transferencia de valor publicada en `/transparencia.html` < 30 días desde la firma.
6. El patrocinador no accede a datos de usuarios ni métricas no agregadas.
7. Sin exclusividad terapéutica (el proyecto puede firmar con otros laboratorios).

---

## 📊 Posibles modalidades de colaboración

| Opción | Descripción | Importe orientativo año 1 |
|---|---|---|
| **A · General** | Patrocinio de plataforma · 3 módulos formativos nuevos a elección del autor | 24.000 € + IVA |
| **B · Jornada** | Jornada formativa presencial para residentes Área II + streaming | 6.000 € + IVA |
| **C · Módulo** | Un módulo formativo específico + revisión por comité independiente | 12.000 € + IVA |

Desglose detallado y clausulado completo en el **dossier v1** que se envía tras confirmación de interés.

---

## 🔜 Siguiente paso sugerido

1. Tu equipo de Medical Affairs revisa este one-pager (10 min lectura).
2. Si hay encaje, me confirmas el interlocutor concreto.
3. Yo envío el **dossier completo de ≈ 12 páginas** con las opciones A/B/C detalladas, clausulado y cronograma.
4. Reunión de 45-60 min presencial o por videollamada.
5. Due diligence legal y redacción de contrato por la asesoría del patrocinador.
6. Firma + publicación en `/transparencia.html` < 30 días.

---

## 📞 Contacto

**Carlos Galera Román**
carlosgalera2roman@gmail.com · `[Teléfono]`
https://area2cartagena.es · https://github.com/carlosgalera-a11y/Cartagenaeste

*Plataforma formativa. No diagnóstica. No sustituye al juicio clínico. Datos seudonimizados con fines docentes conforme a RGPD y LOPDGDD.*

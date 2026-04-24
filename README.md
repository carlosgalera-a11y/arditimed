# 🏥 Cartagenaeste — App médica docente del Área II

[![CI](https://img.shields.io/github/actions/workflow/status/carlosgalera-a11y/Cartagenaeste/ci.yml?branch=main&label=CI&logo=github)](https://github.com/carlosgalera-a11y/Cartagenaeste/actions)
[![License: Proprietary](https://img.shields.io/badge/license-Propietaria-red.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![IP Registrada](https://img.shields.io/badge/IP-Reg.%2000765--03096622-informational.svg)](IP_ATTESTATION.md)
[![Hosting](https://img.shields.io/badge/hosting-GitHub%20Pages-181717?logo=github)](https://area2cartagena.es/)
[![Backend](https://img.shields.io/badge/backend-Firebase%20EU-orange?logo=firebase)](https://firebase.google.com/)
[![Status](https://img.shields.io/badge/status-En%20uso%20cl%C3%ADnico-success)](https://area2cartagena.es/status.html)

**Plataforma formativa y organizador personal de guardia** para profesionales sanitarios. En uso clínico activo en el Servicio de Urgencias del **H.G.U. Santa Lucía** (Área II Cartagena, SMS).

🔗 **[Demo en vivo](https://area2cartagena.es/)** · 📊 **[Estado del servicio](https://area2cartagena.es/status.html)** · 📋 **[Privacidad](https://area2cartagena.es/privacidad.html)** · 📜 **[Licencia](LICENSE)** · ⚖️ **[NOTICE](NOTICE.md)** · 🛡️ **[Security](SECURITY.md)**

> ⚠️ **Herramienta DOCENTE.** No diagnóstica. No sustituye el juicio clínico profesional.

---

## 🔒 AVISO LEGAL — LEER ANTES DE CLONAR

> **Este código NO es open source.** Licencia **propietaria** registrada en la Propiedad Intelectual de la Región de Murcia (expediente **00765-03096622**, Art. 51 LPI).
>
> La visualización pública del repositorio sirve para **transparencia** y **evaluación técnica por terceros** (instituciones, inversores). Cualquier **clonado, reutilización, despliegue paralelo u obra derivada requiere LICENCIA por escrito** del autor.
>
> Ver [NOTICE.md](NOTICE.md) para los términos completos · Contacto para licencias: `carlosgalera2roman@gmail.com`

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML/CSS/JS vanilla · PWA · Service Worker v74 |
| Backend | Firebase Cloud Functions (TypeScript, Node 22, **europe-west1**) |
| Datos | Firestore + Cloud Storage (región EU) |
| Auth | Firebase Authentication (Google + Email/Password) |
| IA | Cloud Function propia (`askAi`) con routing por tipo clínico/educational/vision · DeepSeek + OpenRouter (Gemini, Mistral, Qwen) |
| Monitoring | Sentry (opt-in) + Cloud Logging + GA4 |
| Hosting | GitHub Pages + CNAME a `area2cartagena.es` |
| CI/CD | GitHub Actions (typecheck, tests, secret-scan con gitleaks) |

## Ejecutar localmente

```bash
git clone https://github.com/carlosgalera-a11y/Cartagenaeste.git
cd Cartagenaeste/functions
npm install
npm test                    # unit tests
npm run test:coverage       # con cobertura

# Emuladores Firebase (Firestore + Functions + Auth):
cd ..
firebase emulators:start
```

## Deploy

```bash
# Cloud Functions (Carlos):
firebase functions:secrets:set DEEPSEEK_API_KEY
firebase functions:secrets:set OPENROUTER_API_KEY
firebase deploy --only functions

# Firestore rules + indexes:
firebase deploy --only firestore

# Frontend:
git push origin main                               # Cartagenaeste (fallback URL)
git push area2 main:main --force-with-lease      # area2cartagena (dominio custom)
```

> ⚠️ **No usar** `firebase deploy --only hosting` — el hosting es GitHub Pages. Ver [CLAUDE.md](CLAUDE.md) regla #9.

## Documentación

| Doc | Propósito |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Contexto y reglas innegociables del proyecto |
| [`LICENSE`](LICENSE) | Licencia propietaria + Art. 51 LPI |
| [`IP_ATTESTATION.md`](IP_ATTESTATION.md) | Registro de IP + declaración formal |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de releases |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Cómo colaborar (previa autorización) |
| [`SECURITY.md`](SECURITY.md) | Reporte responsable de vulnerabilidades |
| [`docs/runbook.md`](docs/runbook.md) | Operación: deploy, secretos, rollback |
| [`docs/security-audit-2026-04-21.md`](docs/security-audit-2026-04-21.md) | Auditoría de seguridad |

## Autoría y contacto

- **Autor único y propietario IP**: Carlos Galera Román
- Registro Propiedad Intelectual: **Reg. 00765-03096622** (Art. 51 LPI)
- Contacto: **carlosgalera2roman@gmail.com**
  - Licencias: asunto `[LICENCIA]`
  - Seguridad: asunto `[SECURITY]` — ver [SECURITY.md](SECURITY.md)
  - Partnerships: asunto `[PARTNER]`

---

**App médica docente para profesionales sanitarios del Área II de Cartagena** (Servicio Murciano de Salud). Herramienta de apoyo a la docencia en el Centro de Salud Cartagena Este y centros de salud del área sanitaria.

---

## ¿Qué es Área II Cartagena App?

Aplicación web progresiva (PWA) diseñada como herramienta docente para **médicos residentes (MIR), médicos de familia (MFyC), enfermería y profesionales sanitarios** del Área de Salud II de Cartagena. Incluye protocolos de urgencias, inteligencia artificial para análisis de imagen médica, gestión de pacientes de guardia y directorio telefónico del área sanitaria.

> ⚠️ **Uso exclusivamente docente.** No sustituye el criterio clínico profesional. Las herramientas de IA son orientativas y están destinadas al aprendizaje.

---

## 🩺 Funcionalidades principales

### 📋 77 Protocolos de Urgencias
Protocolos clínicos de actuación en urgencias organizados por especialidad:
- **Cardiología**: Dolor torácico, SCA, arritmias, insuficiencia cardíaca, TEP, síncope
- **Neurología**: Ictus, crisis epiléptica, cefalea, meningitis, alteración consciencia
- **Respiratorio**: Disnea aguda, asma, EPOC, neumotórax, hemoptisis
- **Digestivo**: Hemorragia digestiva, abdomen agudo, pancreatitis, ascitis
- **Traumatología**: Fracturas, luxaciones, traumatismo craneal, politraumatizado
- **Nefrología/Urología**: Cólico renal, insuficiencia renal aguda, RAO
- **Endocrinología**: Cetoacidosis, hipoglucemia, crisis tirotóxica
- **Infecciosas**: Sepsis, neumonía, ITU, celulitis, meningitis
- **Psiquiatría**: Agitación psicomotriz, intento autolítico, crisis de ansiedad
- **Pediatría**: Fiebre, bronquiolitis, convulsiones febriles, deshidratación
- Y muchos más...

### 🤖 Análisis de Imagen Médica con IA (6 modalidades)
Herramientas de inteligencia artificial docente basadas en modelos open-source:
- **Radiografía de Tórax** — TorchXRayVision (14 patologías)
- **Dermatología** — ConvNeXt ISIC (lesiones cutáneas)
- **Radiografía Ósea** — MURA DenseNet-169 (detección anomalías musculoesqueléticas)
- **Radiografía de Abdomen** — Análisis radiológico abdominal
- **ECG** — xresnet1d101 PTB-XL (interpretación electrocardiograma)
- **Ecografía** — EchoNet / MONAI (análisis ecográfico)

### 👥 Gestión de Pacientes de Guardia
- Registro de pacientes con motivo de consulta, evolución y plan
- Cambios de guardia con trazabilidad
- Datos anonimizados y temporales

### 📞 Directorio Telefónico
Teléfonos de contacto del Área II de Cartagena:
- Hospital Santa Lucía y Hospital Rosell
- Centros de salud del área sanitaria
- Servicios de urgencias, laboratorio, radiología
- Coordinación de equipos de atención primaria (EAP)

### 🧮 Calculadoras Médicas
Herramientas de cálculo clínico integradas para uso docente.

---

## 📱 Instalación

### Android (APK)
1. Descarga el APK desde la [página de descarga](https://carlosgalera-a11y.github.io/Cartagenaeste/descargar.html)
2. Permite la instalación desde fuentes desconocidas
3. Instala y accede con tu cuenta Google autorizada

### PWA (cualquier dispositivo)
1. Abre [la app](https://carlosgalera-a11y.github.io/Cartagenaeste/notebook-local.html) en Chrome/Safari
2. **Android**: Pulsa "Instalar" en el banner o Menú → "Añadir a pantalla de inicio"
3. **iPhone/iPad**: Pulsa Compartir ⬆️ → "Añadir a pantalla de inicio"

### Requisitos
- Cuenta Google autorizada (control de acceso)
- Conexión a internet (funcionalidades offline limitadas)
- Navegador moderno (Chrome, Safari, Firefox, Edge)

---

## 🔐 Seguridad y Privacidad

- **Autenticación**: Google Sign-In (OAuth 2.0)
- **Base de datos**: Firebase Firestore (servidor EU-west1, cumplimiento RGPD)
- **Imágenes IA**: Procesadas en tiempo real, nunca almacenadas
- **No se recogen**: datos clínicos de pacientes reales, ubicación, cookies de seguimiento
- **Cifrado**: HTTPS/TLS en todas las comunicaciones
- **RGPD**: Cumplimiento total del Reglamento UE 2016/679

📋 [Política de Privacidad](https://carlosgalera-a11y.github.io/Cartagenaeste/privacidad.html) · 🗑️ [Eliminación de cuenta](https://carlosgalera-a11y.github.io/Cartagenaeste/eliminar-cuenta.html)

---

## 🏗️ Tecnología

| Componente | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Autenticación | Firebase Auth + Google Sign-In |
| Base de datos | Firebase Firestore |
| IA / Vision | Groq API (modelos open-source) |
| Hosting | GitHub Pages |
| PWA | Service Worker, Web App Manifest |
| Android | TWA (Trusted Web Activity) vía PWABuilder |

---

## 🌍 Área de Salud II de Cartagena

El Área de Salud II de Cartagena (Servicio Murciano de Salud - SMS) comprende:

- **Complejo Hospitalario Universitario de Cartagena**: Hospital General Universitario Santa Lucía y Hospital General Universitario Santa María del Rosell
- **16 centros de salud**: Cartagena Este (Virgen de la Caridad), Cartagena Oeste, Cartagena Casco, La Unión, Los Dolores, San Antón, Barrio de Peral, La Manga, Los Alcázares, San Javier, Torre Pacheco, Fuente Álamo, La Aljorra, Los Belones, Cabo de Palos, Pozo Estrecho
- **43 consultorios**: La Aparecida, La Puebla, El Algar, La Palma, Isla Plana, y más
- **Docencia MFyC**: Unidad Docente Multiprofesional de Atención Familiar y Comunitaria

---

## 📬 Contacto

- **Email**: ramongalera22@gmail.com
- **Web**: [carlosgalera-a11y.github.io/Cartagenaeste](https://carlosgalera-a11y.github.io/Cartagenaeste/)

---

## 📝 Licencia

MIT — Uso libre para fines docentes y educativos.

---

**Última actualización**: 25 de febrero de 2026

*App médica docente · Área II Cartagena · Centro de Salud Cartagena Este · Protocolos de urgencias · Docencia Cartagena Este · Servicio Murciano de Salud · Atención Primaria Cartagena · App médica Area 2 Cartagena*

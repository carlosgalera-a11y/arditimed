# Estrategia de adopción · Cartagenaeste

**Autor:** Carlos Galera Román
**Fecha:** 2026-04-24
**Horizonte:** 2026-04-25 (sesión pacientes) · 2026-05-08 (sesión hospital)
**Versión:** 1.0

---

## 1. Situación actual en una frase

Tienes una plataforma formativa que ya funciona clínicamente en Urgencias HGU Santa Lucía pero con solo **5 usuarios registrados en Auth** (todos de tu círculo personal). Los profesionales del servicio probablemente consultan contenido público sin loguearse, pero **no están contribuyendo al repositorio común** ni usando las funciones con IA de manera sistemática. El objetivo de las próximas dos sesiones es convertir ese uso pasivo en una **red activa de aportaciones**.

---

## 2. Dos audiencias, dos mensajes

### 2.1 Pacientes (sesión 25 abril 2026)

**Perfil psicográfico:**
- Edad media 55-75, adherentes al sistema público.
- Desconfianza leve hacia "aplicaciones" (identificado como "cosa de jóvenes").
- Alto interés si detectan **utilidad inmediata para resolver dudas** o **acceso más rápido al médico**.

**Mensaje nuclear:**
> "Es una herramienta hecha por tu médico para ti. Entras con el móvil, miras la información que te interesa y llegas a la consulta mejor preparado. Ni dar datos personales, ni descargar nada."

**Anclas persuasivas:**
1. **Familiaridad:** "Igual que revisas el tiempo antes de salir, aquí revisas tu consulta antes de ir al médico."
2. **Autoridad del autor:** "Lo ha hecho un médico de vuestro centro, no una empresa."
3. **Gratuito y privado:** "No pide DNI, ni email obligatorio, ni vende datos."
4. **Sin ansiedad tecnológica:** "Si os perdéis, vuestros hijos os lo enseñan en 2 minutos. La home tiene 3 botones grandes."

**Secciones a destacar en voz alta:**
- `prepara-consulta.html` (preguntas a llevar al médico)
- `consejos-salud.html` (fichas de enfermedades crónicas)
- `recursos-comunitarios.html` (teléfonos útiles, farmacias, dependencia)
- `chatbot-medicacion.html` (interacciones medicamentosas básicas)

**Llamada a la acción:**
Escanear el QR en ese momento. **No pedir registro al paciente**, solo que la guarde en favoritos del navegador. Login opcional mencionado como "si queréis probar la parte de inteligencia artificial para preparar dudas, os registráis cuando queráis".

**Métrica de éxito sábado 26:**
- 20-45 usuarios nuevos en GA4 con `utm_source=sesion-pacientes-25abril`.
- Pico de tráfico en franja 18:00-22:00 en `prepara-consulta.html` y `consejos-salud.html`.
- Bonus: 3-5 registros Auth con @gmail.com.

---

### 2.2 Profesionales sanitarios (sesión 8 mayo 2026)

**Perfil psicográfico:**
- Médicos adjuntos, residentes, enfermería de Urgencias HGU Santa Lucía.
- Alta carga asistencial → intolerancia a herramientas que añaden fricción.
- Escépticos de IA por mala experiencia con demos corporativas (ChatGPT genérico, Copilot sin contexto clínico).
- Valoran: rapidez, precisión farmacológica, trazabilidad, datos en UE.

**Mensaje nuclear:**
> "Esto no te pide que cambies cómo trabajas. Te ahorra clicks. Te da el vademécum, los protocolos y la calculadora en un sitio. Y cuando le enseñas un caso, la IA te devuelve un diagnóstico diferencial razonado que puedes corregir, no un texto genérico."

**Anclas persuasivas:**
1. **Autoridad de par:** "Lo uso yo en guardia. Ramón también. Preguntadles."
2. **Contexto clínico local:** "El vademécum tiene medicación según SMS, no según nomenclator yankee. Los recursos sociales son los de Cartagena."
3. **Seudonimización estricta:** "No guarda DNI, no guarda NHC. Solo iniciales + número de cama. App Check enforcado en producción."
4. **Valor IA real:** "La IA no está para reemplazar tu juicio. Está para acelerar el diagnóstico diferencial cuando tienes 15 pacientes en espera y la residente de guardia está en el politraumático."
5. **Red comunitaria:** "Cada caso que subes aporta al repositorio. Cada plantilla que haces la pueden usar los demás. Es un cuaderno compartido de guardia, no una app comercial."

**Bloque obligatorio de 3 minutos en la charla:**
1. Proyecta `https://area2cartagena.es/profesionales.html` en pantalla grande.
2. "Sacad el móvil ahora. Escanead el QR."
3. "Dadle a 'Iniciar sesión con Google' — no os pide instalar nada."
4. "Que cada uno confirme al de al lado que ha visto la pantalla de bienvenida."
5. Tú refrescas `admin-dashboard.html` en pantalla y ves llegar los registros en vivo. Aplauso colectivo cuando lleguéis a 10.

**Secciones a demostrar en vivo (elegir 2, no más):**
- **Scan IA** (`scan-upload.html`): sube foto de ECG o analítica → IA la interpreta en < 15s.
- **Triaje IA** (`triaje-ai.html`): introduce síntomas → propone gravedad Manchester + actitud inicial.
- **PROA** (`proa.html`): busca antibiótico por germen → sale la recomendación local SMS.

**Llamada a la acción (3 compromisos por profesional):**
1. **Suscribirse:** login con Google (obligatorio para la parte IA).
2. **Contribuir:** enviar 1 caso clínico seudonimizado en el primer mes vía `sugerencias.html`.
3. **Compartir:** enseñárselo a 1 compañero/a en la próxima guardia.

**Métrica de éxito viernes 9 mayo:**
- 15-30 registros nuevos en Auth con @gmail.com (muchos SMS usan gmail personal para apps).
- Crecimiento del top gastadores de DeepSeek en el dashboard admin.
- Primeras sugerencias anónimas en la colección `sugerencias`.
- `utm_source=sesion-hospital-8mayo` disparándose en GA4.

---

## 3. Arquitectura persuasiva: por qué una "red" y no una "app"

La pregunta repetida que te harán será: *"Pero... ¿tengo que meter datos ahí?"*

**Respuesta marco:**

> "Esto no es una base de datos de pacientes. Es un **repositorio común de conocimiento** donde:
> - Los **pacientes** encuentran información validada por un médico de su centro.
> - Los **médicos** encuentran una segunda opinión IA para casos complejos.
> - La **enfermería** tiene las calculadoras y escalas clínicas a un click.
> - Y **todos** contribuimos con casos, plantillas, y sugerencias que acaban beneficiando al siguiente profesional o paciente."

**Tres argumentos finales para desbloquear al escéptico:**

1. **"Ya existe. Ya funciona. No te pido que creas en nada, te pido que la mires 2 minutos."**
2. **"No te cuesta nada. Ni descargar, ni registrarte obligatorio, ni dar DNI. Si no te sirve, cierras la pestaña."**
3. **"Tu participación mejora la herramienta para tus residentes y para tus pacientes. No me beneficia a mí; me beneficia si a todos nos pasa lo mismo."**

---

## 4. Anti-patrones a evitar

| ❌ NO HAGAS ESTO | ✅ HAZ ESTO EN SU LUGAR |
|---|---|
| "Es una app de inteligencia artificial para medicina" | "Es el cuaderno de guardia de Cartagena, con IA cuando la necesitas" |
| Hablar de GPT-4 / DeepSeek / arquitectura técnica | Hablar de "te ahorra 3 clicks" y "el vademécum está local" |
| Pedir "registraos cuando podáis" | "Sacad el móvil. 2 minutos. Ahora." |
| Presentar todas las funciones | Demostrar 2 funciones bien, dejando curiosidad |
| Mencionar "replicable a otras áreas" / "proyecto escalable" | "Está pensado para Cartagena. Si sale bien, otros copiarán" |

---

## 5. Post-sesión: cómo capitalizar el momentum

### Primeras 48h tras cada sesión:
- Revisar `admin-dashboard.html` → sección GA4 filtrada por `utm_source` de la sesión correspondiente.
- Contar registros nuevos en Auth con `ramongalera22` (si mantiene acceso) o `carlosgalera2roman`.
- Identificar early adopters por emails del dashboard → WhatsApp personal de agradecimiento individual.

### Primera semana:
- Enviar al grupo de WhatsApp de Urgencias 1 caso destacado anonimizado generado con la IA.
- Publicar en LinkedIn: "Tras la sesión del 8 mayo, 27 profesionales del Área II ya usan Cartagenaeste. Gracias a todos."

### Primer mes:
- Sesión de feedback abierta (30 min) para recoger mejoras. Acudir con 1 mejora ya implementada.
- Primer informe mensual para Dirección Médica (PDF del propio dashboard, sección KPIs para reporting).

---

## 6. Ficha rápida del día D (imprimir y llevar al bolsillo)

### Pacientes · 25 abril 2026

1. QR: `https://area2cartagena.es/?utm_source=sesion-pacientes-25abril`
2. Abrir `prepara-consulta.html` y `recursos-comunitarios.html` en el proyector.
3. Frase clave: **"Ni registro, ni DNI, ni descargar nada."**
4. CTA: "Guardadla en favoritos. Si queréis, registraos."

### Profesionales · 8 mayo 2026

1. QR: `https://area2cartagena.es/profesionales.html?utm_source=sesion-hospital-8mayo`
2. Abrir `scan-upload.html` y `triaje-ai.html` en el proyector.
3. Frase clave: **"Ya funciona. No es una demo. Es vuestro cuaderno."**
4. CTA bloqueo de 3 minutos:
   - Sacad móvil → QR → Login Google → grito en grupo al llegar a 10 registros en mi pantalla.

---

## 7. Dashboard de seguimiento (ya tienes las métricas)

Tras los eventos, abre `https://area2cartagena.es/admin-dashboard.html` (solo cuenta `carlosgalera2roman@gmail.com`) y revisa:

| Sección | Qué mirar | Umbral de éxito |
|---|---|---|
| 🌐 Tráfico web (GA4) · filtro area2 | Sesiones con `utm_source=sesion-*` | > 20 en primeras 24h |
| 👥 Top usuarios por coste | Emails nuevos tras las sesiones | > 10 emails nuevos |
| 🏢 Distribución por dominio | Proporción @gmail.com vs otros | @gmail.com > 60% |
| 🔥 Gasto por proveedor IA | Top 3 gastadores DeepSeek | 3 usuarios distintos de ti |
| 🤖 Uso por modelo | Coste mensual DeepSeek | < 5 € con 30 usuarios activos |

---

## 8. Plantilla para Dirección Médica (si el 8 mayo sale bien)

> **Estimada Dra. XXXX,**
>
> Tras la sesión del 8 de mayo de 2026, `Cartagenaeste` — la plataforma formativa desarrollada internamente en el Área II — ha pasado a ser utilizada activamente por N profesionales del servicio de Urgencias HGU Santa Lucía.
>
> Datos de las primeras 2 semanas:
>
> - N usuarios únicos registrados.
> - N casos clínicos seudonimizados aportados al repositorio común.
> - N consultas de vademécum farmacológico local (SMS).
> - Coste operativo mensual: N € (servicios IA en UE, cumplimiento RGPD).
>
> La herramienta opera en cumplimiento del EU AI Act 2024/1689, con datos seudonimizados y región europe-west1. Está registrada en Propiedad Intelectual (00765-03096622).
>
> Solicito reunión de 30 min para valorar:
>
> 1. Integración oficial con la intranet del SMS.
> 2. Posibilidad de sesiones formativas reconocidas por la Comisión de Docencia.
> 3. Ampliación a otras áreas (Murcia, Cartagena III, Lorca) si se considera útil.
>
> Quedo a su disposición.
>
> Dr. Carlos Galera Román
> MFyC · H.G.U. Santa Lucía · Área II

---

## 9. Recordatorios finales

- **No menciones marcas farmacéuticas** en ninguna sesión (CLAUDE.md §5).
- **No menciones partners externos** (UMU, AstraZeneca, etc. sin aprobación explícita).
- **Todo el contenido clínico con disclaimer formativo visible**: "Plataforma formativa. No diagnóstica. No sustituye juicio clínico."
- **Si alguien pregunta por datos**: "Seudonimizados, en UE, App Check enforcado, sin DNI ni NHC."

---

*Documento generado 2026-04-24. Revisión próxima tras la sesión del 8 mayo. Carlos Galera Román.*

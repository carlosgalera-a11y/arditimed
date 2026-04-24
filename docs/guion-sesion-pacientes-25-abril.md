# Guión · Sesión informativa a pacientes

**Fecha:** viernes 25 de abril de 2026
**Duración:** 10-15 minutos + 5 minutos Q&A
**Objetivo:** que salgan con la web abierta en su móvil y sintiéndose **dueños** de la herramienta, no pacientes pasivos. Medir cuántos la usan en las próximas 2 semanas.

---

## 🎯 Una única promesa al inicio (30 s)

> **"Os voy a enseñar una web gratis, hecha por un médico del Área II Cartagena, para que vosotros mismos podáis entender mejor vuestra salud y llegar a la consulta con las ideas más claras. No sustituye al médico, os prepara para ir al médico mejor."**

Esa frase abre la sesión. El resto del guión apoya esa frase.

---

## 🧭 Orden de los 10 minutos

### Bloque 1 · Presentación honesta (1 min)

- *Me llamo Carlos Galera, soy residente de Medicina Familiar aquí en el Área II.*
- *Durante los últimos meses he construido esta herramienta, al margen del hospital, para mejorar cómo me organizo yo en las guardias — y he pensado que podría ser útil para vosotros también.*
- *Es completamente gratis, no tiene publicidad, y no guarda vuestros datos personales.*

### Bloque 2 · Problema real que resuelve (1-2 min)

Preguntar al público:

- *"Levantad la mano: ¿quién ha salido alguna vez del médico y al llegar a casa ha pensado 'se me ha olvidado preguntarle esto'?"*
- *"¿Quién ha buscado en Google síntomas y ha terminado más asustado que al principio?"*
- *"¿Quién ha necesitado encontrar un recurso social (ayuda a domicilio, teléfono contra la violencia de género, dónde vacunarse...) y no ha sabido por dónde empezar?"*

**Ahí está el dolor.** La web ataca exactamente esos 3 problemas.

### Bloque 3 · Demo en vivo (5 min · lo más importante)

Abrir en pantalla grande `https://area2cartagena.es` y **mostrar en este orden**:

1. **Página principal** (15 s)
   - *"Una sola dirección que os guardáis en el móvil."*

2. **Apartado PACIENTES** (1 min)
   - Entrar en `/pacientes.html`.
   - Enseñar las 4 secciones principales: Consejos de salud · Prepara tu consulta · Recursos comunitarios · Fichas de información.

3. **Demo real · "Prepara tu consulta"** (1,5 min)
   - Entrar en `/prepara-consulta.html`.
   - Mostrar cómo **escribir 5 síntomas** y que la web te devuelve un resumen para llevar al médico.
   - *"Imagínad que vais al médico de familia el lunes. Esto os prepara el lunes mientras desayunáis."*

4. **Demo real · "Recursos comunitarios"** (1,5 min)
   - Entrar en `/recursos-comunitarios.html`.
   - Mostrar el **mapa con teléfonos de 112, 061, violencia de género, ayuda a domicilio, salud mental**.
   - *"Cuando uno lo necesita, no se acuerda de dónde buscar. Esto lo tenéis guardado ya."*

5. **Consejos de salud** (1 min)
   - Entrar en `/consejos-salud.html`.
   - Mostrar una ficha concreta (ej. hipertensión, dieta, ejercicio).
   - *"Información escrita por médicos, no por Google."*

### Bloque 4 · Seguridad · lo que NO hace la web (1 min)

- *"**No** os voy a diagnosticar nada. No sustituye al médico."*
- *"**No** guardo vuestros datos personales. Ni nombre, ni DNI, ni nada."*
- *"**No** tiene publicidad. Nunca la tendrá."*
- *"Si alguna vez un anuncio os aparece, escribidme porque algo ha salido mal."*

### Bloque 5 · Llamada a la acción · que se suban AHORA (2 min)

Pedir a la gente que **saque el móvil**.

Opción A · **Código QR en pantalla**:
- Proyectar el QR de `https://area2cartagena.es/?utm_source=sesion-pacientes-25abril`.
- *"Apuntad con la cámara al QR. Se os abre sola."*
- *"Una vez abierta, pulsad el botón 'Añadir a pantalla de inicio' y ya la tenéis en el móvil como una app."*

Opción B (si el QR no funciona):
- *"Escribid en el navegador: área dos cartagena punto es. Todo junto."*

**Apoyar al que no pueda** con un voluntario en cada fila (un MIR de la Unidad Docente que acompañe).

### Bloque 6 · Una sola petición final (1 min)

> *"Os pido tres cosas: (1) usadla esta semana si tenéis una consulta al médico pendiente; (2) si un amigo o familiar vive en el Área II, compartidle el enlace; (3) si algo no funciona, escribidme a carlosgalera2roman@gmail.com. Gracias por venir."*

---

## 🎥 Material imprescindible a llevar

- [ ] Portátil + cable HDMI + cable de corriente.
- [ ] El **QR impreso grande** (A3 si es posible) pegado al atril.
- [ ] 30-50 **flyers impresos** con el QR pequeño y el texto *"área2cartagena.es · pide cita con tu salud"*.
- [ ] Un **rotulador y folios** por si quieren apuntar preguntas.
- [ ] Móvil con datos (por si el wifi falla).
- [ ] Tabla de contenidos impresa por si te pierdes.

---

## ⚠️ Qué NO hacer

- ❌ No prometer diagnósticos ni tratamientos.
- ❌ No criticar al sistema sanitario, al hospital ni a otros médicos.
- ❌ No usar jerga técnica (palabras prohibidas: *"interfaz", "IA", "dataset", "Firestore", "compliance"*).
- ❌ No alargar más de 15 min aunque vaya muy bien.
- ❌ No enseñar el módulo de IA profesional (Scan IA, Rx, ECG) — es para médicos, no para pacientes; si lo ven genera confusión.
- ❌ No pedir dinero en esta sesión. Esta es una sesión de **utilidad pública**.

---

## 📊 Cómo medir el éxito de esta sesión

Desde el momento en que envías la URL con `?utm_source=sesion-pacientes-25abril`, GA4 registra quién entra vía esa sesión durante los siguientes 30 días.

Métricas que vas a poder ver el lunes en `admin-dashboard.html`:

| Métrica | Dónde verla | Objetivo razonable |
|---|---|---|
| Usuarios únicos con `utm_source=sesion-pacientes-25abril` | GA4 Realtime + Reports | ≥ 60% de asistentes |
| Sesiones iniciadas tras escanear el QR | GA4 Source/Medium | ≥ 50% asistentes |
| Páginas más vistas | GA4 Reports → Pages | Esperado: prepara-consulta, recursos-comunitarios |
| Tasa de rebote | GA4 | < 60% |
| Instalaciones como PWA | Evento `beforeinstallprompt` (si lo instrumentamos) | ≥ 20% |

**Regla personal**: si llegan ≥ 30 visitas vía `sesion-pacientes-25abril` en la semana siguiente, la sesión ha sido un éxito. Si son menos de 10, revisar formato.

---

## 🎯 Qué dejar para la próxima vez

Si la sesión va bien, lo siguiente:
- Pedir a la persona de referencia de pacientes del Área II (asociaciones, grupo aula de salud) que la enlace en su newsletter.
- Ofrecer una sesión en un Centro de Salud concreto que quiera pilotarla.
- Proponer un artículo/entrevista en *La Verdad* o prensa local.

---

## 🗣️ Respuestas rápidas a preguntas típicas

| Pregunta | Respuesta corta |
|---|---|
| *"¿Cuesta algo?"* | *"No, es totalmente gratis y lo será."* |
| *"¿Quién paga esto?"* | *"De mi bolsillo. Busco que el hospital lo use y me ayude a mantenerlo, pero aunque no lo haga seguirá gratis para los pacientes."* |
| *"¿Mis datos están seguros?"* | *"Sí. No guardo nombre, ni DNI, ni NHC. Solo cosas agregadas como 'hoy han entrado 12 personas'."* |
| *"¿Funciona en iPhone?"* | *"Sí, en iPhone y Android. En ordenador también."* |
| *"¿Necesito registrarme?"* | *"No. Podéis usar todo lo público sin registro."* |
| *"¿Puedo confiar en lo que dice?"* | *"Las fuentes están enlazadas: guías oficiales, Ministerio de Sanidad, sociedades médicas. No es Google, es información curada por un médico."* |
| *"Mi hijo no para en el móvil y mezcla ChatGPT con todo, ¿esto es lo mismo?"* | *"No. Esto está hecho por un médico, los contenidos están revisados, y nunca sustituye la consulta con vuestro médico de familia. Es un complemento, no un reemplazo."* |

---

## 📋 Checklist última hora

- [ ] Probar el proyector y el audio 10 min antes.
- [ ] Abrir `area2cartagena.es` en el navegador antes de empezar (evita el tiempo de carga inicial en directo).
- [ ] Descargar **en local** un screenshot de cada página que vayas a mostrar (backup si cae internet).
- [ ] Tener el QR y los flyers en la mesa.
- [ ] Agua a mano.
- [ ] Móvil silenciado.
- [ ] Firmante voluntario: un MIR que te pase agua y te sujete el flyer si vas a hacer demo móvil en mano.

---

## Después de la sesión (1 h)

Anotar en `docs/notas-sesion-pacientes-2026-04-25.md`:
- Número asistentes real.
- 3 preguntas más repetidas.
- 3 cosas que funcionaron.
- 3 cosas a mejorar para la del 8 de mayo.
- Screenshot del `admin-dashboard.html` del lunes mostrando tráfico `utm_source=sesion-pacientes-25abril`.

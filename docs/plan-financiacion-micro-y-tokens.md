# Plan de financiación mínima · tokens IA + operativo

**Fecha:** 24 de abril de 2026
**Horizonte:** 30 días · fin de fase "cero ingresos" · arranque de "adoptación real"

> Documento honesto: hoy no hay ingresos. Necesitas 50-100 €/mes para que la plataforma no quede paralizada mientras maduran los contratos grandes. Este plan ordena las **4 rutas de micro-financiación** por probabilidad × plazo × dignidad.

---

## 0. Diagnóstico rápido

| Pregunta | Respuesta |
|---|---|
| ¿Qué necesitas mínimo-mínimo? | **40-80 €/mes** para DeepSeek API con saldo (sustituir free tier) + seguro RC + ciber amortizado. |
| ¿Cuánto te aguantas sin financiar? | Meses. La cadena free tier de DeepSeek funciona pero con rate limits severos. |
| ¿Cuál es el peor escenario si no captas financiación? | Fallbacks más lentos + sin seguro RC + no poder firmar con el hospital. |
| ¿Qué pasa si activas saldo DeepSeek por 20 €? | Cubres 2-3 meses de uso en fase de adopción. |

**Conclusión**: la barrera económica para empezar es **20-30 € de saldo DeepSeek**. Lo pones tú esta semana. Si consigues un solo early adopter institucional con micro-patrocinio, cubres 6-12 meses.

---

## 1. Qué cuesta realmente cada mes (hoy → 1.000 MAU)

### 1.1 DeepSeek API · tokens

| Modelo | Precio | 3.000 llamadas/mes (~100 MAU) | 36.000 llamadas/mes (~1.000 MAU) |
|---|---|---|---|
| Input | 0,27 $/1M tokens | 0,24 $/mes | 2,90 $/mes |
| Output | 1,10 $/mes | 1,65 $/mes | 19,80 $/mes |
| **Total DeepSeek paid** | | **~3 $/mes** | **~25-30 $/mes** |

**Traducción:** con **20 € de saldo cargado en DeepSeek** hoy, te aguantas **5-6 meses** al ritmo actual. Si el hospital entra con 100 MAU, te aguantas 2-3 meses.

### 1.2 Coste TOTAL mensual (todo incluido)

| Partida | Hoy | Tras 8 mayo (50-100 MAU) | 1.000 MAU |
|---|---|---|---|
| DeepSeek tokens | 0 € (free) | 3-5 €/mes | 25-30 €/mes |
| Firebase (Blaze) | 0 € | 3-8 €/mes | 10 €/mes |
| Dominio | 1,25 €/mes | 1,25 €/mes | 1,25 €/mes |
| Seguro RC + ciber | 0 € | 40-75 €/mes | 40-75 €/mes |
| Uptime Robot | 0 € | 0 € | 0 € |
| **TOTAL** | **1,25 €/mes** | **47-90 €/mes** | **75-115 €/mes** |

---

## 2. Las 4 rutas de micro-financiación · priorizadas

### Ruta 1 · **Autofinanciación** (ya la haces) · 0-30 días

**Cuánto**: 20-50 € de saldo en DeepSeek API.
**Pros**: inmediato · sin dependencias · tú controlas.
**Contras**: sale de tu bolsillo.
**Cuándo hacerlo**: **HOY**.

Pasos:
1. Ir a https://platform.deepseek.com/
2. Crear cuenta con `carlosgalera2roman@gmail.com`.
3. Pestaña **API Keys** → generar nueva clave.
4. Pestaña **Billing** → añadir método de pago → cargar **20 $** de saldo.
5. Copiar la API key.
6. Guardarla en Secret Manager:
   ```bash
   cd ~/cartagenaestewebappSOLIDA
   echo -n "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | \
     firebase functions:secrets:set DEEPSEEK_API_KEY
   firebase deploy --only functions:askAi
   ```
   (O sustituir el Secret existente; ya tienes `DEEPSEEK_API_KEY` como secret).
7. Verificar que sigue funcionando con `firebase functions:log --only askAi`.

**Resultado**: deja de ser "cadena free tier" y pasa a SLA real. Puedes decirle al Jefe de Urgencias "ya estamos en SLA pagado".

### Ruta 2 · **Comisión de Docencia HSL / Unidad Docente MFyC** · 30-60 días

**Cuánto**: 200-1.000 € como **beca formativa** o **gasto en material docente digital**.
**Pros**: ciclo rapidísimo (contrato menor de Docencia) · justificación clarísima · sin bloqueantes legales.
**Contras**: presupuesto limitado y anual.
**Cuándo hacerlo**: tras la sesión del 8 de mayo (con cartas firmadas).

Pasos:
1. Solicitar reunión con Jefe de Estudios / Coordinador Unidad Docente MFyC (1 semana).
2. Llevar: dossier comercial + cartas de apoyo de residentes + propuesta de 4 sesiones formativas (hipertensión, asma, IAM, triaje).
3. Solicitar **ayuda formativa** de 500-1.000 € como **gasto docente** del ejercicio 2026.
4. Contrapartida: Cartagenaeste ofrece acceso para todos los residentes + 4 sesiones impartidas por ti + reporting de uso por residente.

**Argumento**: *"Es el primer contrato de formación digital con contenidos propios del Área II; genera visibilidad para la Unidad Docente."*

### Ruta 3 · **Fundación HSL / Fundación para la Formación e Investigación Sanitaria de Murcia (FFIS)** · 60-180 días

**Cuánto**: 500-3.000 € como **beca de innovación** o **proyecto piloto**.
**Pros**: ciclo corto-medio · específicamente orientado a innovación clínica.
**Contras**: convocatorias puntuales · no siempre abiertas.
**Cuándo**: consultar calendario de ayudas FFIS 2026.

Pasos:
1. Revisar https://ffis.es/ayudas-convocatorias.
2. Buscar convocatoria abierta de **innovación digital en salud** o **formación continuada**.
3. Si hay convocatoria, preparar memoria en 15 días:
   - Estado del arte (lo tienes hecho con `audit-costes-escalado-1000-usuarios.md`).
   - Justificación.
   - Plan de trabajo.
   - Presupuesto detallado (tokens IA, seguro, acreditaciones).
4. Si no hay convocatoria, **esperar a la siguiente** y mientras tanto captar datos de uso como evidencia.

### Ruta 4 · **Micro-patrocinio con profesionales del Área II** · 90-180 días

**Cuánto**: 5-25 €/mes × N profesionales comprometidos = 50-250 €/mes.
**Pros**: sostenible · crea comunidad · independencia total.
**Contras**: dignidad limitada (parece crowdfunding médico) · gestión administrativa tediosa.
**Cuándo**: último recurso, solo si rutas 1-3 fallan.

Mecanismo elegante (no pedigüeño): botón **"Apoya la plataforma"** en el footer con:
- Donación única de 10/25/50 €.
- Suscripción mensual simbólica 5 €/mes.
- "Hazte patrocinador del piloto" (email a ti).

**Stripe / Ko-fi / Buy Me a Coffee** → todos integran en 15 min. Si decides activarlo:

```html
<!-- footer-global.js block opcional -->
<a href="https://ko-fi.com/cartagenaeste" class="cfg-badge" style="background:#ef4444;color:#fff">
  💚 Apoya el proyecto · desde 5 €
</a>
```

**Recomendación**: **no activar hasta después del 8 mayo**. Hasta entonces la plataforma es pura, sin botón de donación. Si tras el 8 no hay ruta 2/3, se activa como plan B.

---

## 3. Estrategia · qué haces cuando

### Esta semana (24-28 abril)

- [ ] **HOY**: cargar 20 $ en DeepSeek API, sustituir secret en Firebase, deploy askAi.
- [ ] Email al Jefe Urgencias con cifra mensual (ya redactado).
- [ ] Email al rep de AstraZeneca con one-pager (ya redactado).
- [ ] Sesión a pacientes **mañana 25 abril** (guión listo).
- [ ] Preparar sesión 8 mayo (guión listo).

### Próxima semana (29 abr - 2 may)

- [ ] **Reunión EGS martes 29**.
- [ ] Email abogado (ya redactado) con las 3 decisiones.
- [ ] Reservar presupuesto de unos 50 € para que compres impresiones (flyers, QR, cartas de apoyo, dossier × copias) para la sesión del 8 mayo.

### Post-sesión 8 mayo (11-22 mayo)

- [ ] Si ≥ 10 cartas firmadas → reunión con Comisión de Docencia pidiendo 500-1.000 €.
- [ ] Si ≥ 15 cartas → reunión con Dirección Médica.
- [ ] Revisar convocatorias FFIS abiertas.
- [ ] Si hay respuesta positiva AZ → escalar a dossier completo v1.

### Mayo completo

- [ ] Firma contrato Urgencias HSL ≈ semana del 1-7 junio (post-fin residencia).
- [ ] Primera factura = cubre costes operativos del año 1 holgadamente.

---

## 4. Respuestas a preguntas incómodas sobre dinero

| Pregunta | Respuesta |
|---|---|
| *"Si lo has hecho tú solo, ¿para qué necesitas dinero?"* | *"Para mantener la calidad del servicio (IA pagada con SLA) y la seguridad legal (seguro RC + ciber), no para mi tiempo — mi tiempo lo regalo durante la fase piloto. El dinero va a los proveedores, no a mí."* |
| *"¿Por qué no lo haces gratis?"* | *"Hacerlo gratis me obliga a usar servicios gratuitos que se caen o tienen peor SLA. El dinero mejora la experiencia clínica. Es como preguntar por qué el hospital paga la luz en lugar de usar generador diésel."* |
| *"¿Cuánto ganas tú con esto?"* | *"Ahora mismo 0 €. Mi proyección año 1 es cubrir mi tiempo con el contrato de Urgencias (si se firma). En año 2+ aspiro a una retribución digna. Todo lo público en /transparencia.html."* |
| *"¿Por qué el hospital debe pagar algo que tú has hecho?"* | *"Porque mantenerlo cuesta (infraestructura, seguro, acreditaciones). Si el hospital no lo paga, alguien tiene que hacerlo — y si soy yo, se degrada la calidad del servicio. Es un win-win cuantificado en la propuesta."* |
| *"¿No deberías cederlo a SMS?"* | *"Podría. Pero entonces se convierte en un activo público que probablemente nadie mantenga activamente. Lo sostiene mejor el autor con contratación del SMS. Muchos proyectos públicos mueren así."* |

---

## 5. Señal de fracaso · cuándo parar

Si al cabo de **90 días** (24 abril → 23 julio) ninguna de las 4 rutas ha traído ni 200 € de financiación externa, revisar el modelo:

- Quizá el posicionamiento formativo limita los ingresos.
- Quizá el canal correcto es otro (EGS / privados / fuera de Murcia).
- Quizá conviene **pivotar** a SaaS B2B puro sin uso hospitalario directo.
- Quizá conviene **donar** la plataforma a la Unidad Docente y liberarse como autor.

**NO seguir más de 90 días quemando tu dinero sin ingreso externo.** Es un red flag de producto-mercado-fit.

---

## 6. Comandos útiles para activar DeepSeek paid HOY

```bash
# 1. Cuenta + saldo en DeepSeek
# Ir a https://platform.deepseek.com/ → añadir 20 $

# 2. Sustituir secret
cd ~/cartagenaestewebappSOLIDA
firebase functions:secrets:set DEEPSEEK_API_KEY
# (pega la API key nueva cuando pida)

# 3. Redeploy askAi
firebase deploy --only functions:askAi

# 4. Verificar
firebase functions:log --only askAi --limit 10

# 5. (opcional) Activar monitor de presupuesto en DeepSeek
# En el panel de DeepSeek: Billing → Budget alert → 15 $ threshold
```

**Tiempo total**: 15 minutos.

---

## 7. Historial de revisiones

| Fecha | Cambio |
|---|---|
| 2026-04-24 | Documento inicial. 4 rutas priorizadas. Ruta 1 ejecutable HOY por 20 €. |

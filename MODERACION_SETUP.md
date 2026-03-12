# 🛡️ Guía de configuración del sistema de moderación

## Paso 1 — Desplegar reglas de Firestore
1. Ve a https://console.firebase.google.com/project/docenciacartagenaeste
2. Firestore → Reglas → Pega el contenido de `firestore.rules`
3. Publicar

## Paso 2 — Desplegar reglas de Storage
1. Storage → Reglas → Pega el contenido de `storage.rules`
2. Publicar

## Paso 3 — Añadir un moderador desde la app
1. Inicia sesión con tu cuenta (ramongalera22@gmail.com)
2. Abre el Panel Admin → botón "🛡️ Moderación"
3. En la parte superior verás "Gestión de Moderadores" (solo visible para ti)
4. Introduce el email Google del nuevo moderador + nombre visible
5. Pulsa "✓ Añadir"

### ¿Qué necesita hacer el nuevo moderador?
→ **Nada especial**. Solo necesita:
- Tener una cuenta de Google (cualquier gmail.com o GSuite)
- Abrir la app e iniciar sesión con esa cuenta de Google
- Automáticamente verá el botón 🛡️ Moderación en el navbar
- El botón muestra el número de propuestas pendientes en rojo

## Flujo completo

### Usuario normal logueado
1. Inicia sesión con su Google → ve botón "📤 Proponer contenido" en las secciones
2. Rellena: sección destino, tipo (archivo/URL), título, descripción opcional
3. Sube el archivo (va a Firebase Storage en carpeta /propuestas/) o pega URL
4. La propuesta queda en Firestore /propuestas_contenido con estado=pendiente

### Moderador
1. Inicia sesión → aparece "🛡️ Moderación (N)" con N = propuestas pendientes
2. Abre el panel → ve todas las propuestas pendientes con vista previa
3. Pulsa ✅ Aprobar o ❌ Rechazar (puede añadir motivo al rechazar)
4. El estado se actualiza en Firestore inmediatamente

### Superadmin (tú)
- Todo lo de moderador, más:
- Pestaña "Gestión de Moderadores" para añadir/desactivar moderadores
- El cambio es inmediato: el moderador tendrá acceso en su próxima sesión

## Estructura en Firestore
```
/moderadores/{docId}
  email: "usuario@gmail.com"
  nombre: "Dr. García"
  rol: "moderador"
  activo: true
  añadidoPor: "ramongalera22@gmail.com"
  fechaAlta: timestamp

/propuestas_contenido/{docId}
  titulo: "Protocolo EPOC"
  seccion: "Protocolos AP"
  tipo: "archivo" | "url"
  url: "https://..."
  fileName: "protocolo-epoc.pdf"
  storagePath: "propuestas/uid_timestamp.pdf"
  estado: "pendiente" | "aprobado" | "rechazado"
  email: "autor@gmail.com"
  nombre: "Dr. Apellido"
  descripcion: "..."
  timestamp: number
  fecha: timestamp
  moderadoPor: "moderador@gmail.com" (al moderar)
  motivoRechazo: "..." (si rechazado)
```

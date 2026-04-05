# ⚠️ CONFIGURACIÓN CRÍTICA — NO MODIFICAR

## Autotriaje: Acceso LIBRE sin login

**Decisión**: El Autotriaje de Urgencias funciona sin necesidad de autenticación (login con Google).

**Razón**: Los pacientes que usan el autotriaje no tienen (ni deben necesitar) cuenta de Google para generar su QR de triaje. Es una herramienta para el paciente, no para el profesional.

**Implementación** (en `app-modules.js`):

### 1. Generación de QR — Dos funciones afectadas:
- `trClasGenerarQR()` → Triaje clásico (por pasos)
- `trIASaveAndShowQR()` → Triaje con IA conversacional

### 2. Patrón obligatorio en ambas funciones:
```javascript
// SIEMPRE verificar auth antes de escribir en Firestore
if (typeof db !== 'undefined' && firebase.auth().currentUser) {
    // Usuario logueado → guardar en Firestore
    var docRef = await db.collection('triajes').add(fichaData);
    fichaUrl = baseUrl + 'triaje-ficha.html?id=' + docRef.id;
} else {
    // Sin login → codificar datos en la URL del QR
    var compact = { n: nivel, v: verifyCode, m: motivo, ... };
    fichaUrl = baseUrl + 'triaje-ficha.html?d=' + encodeURIComponent(btoa(...));
}
```

### 3. `createdAt` seguro:
```javascript
createdAt: (typeof firebase!=='undefined' && firebase.firestore && firebase.firestore.FieldValue)
    ? firebase.firestore.FieldValue.serverTimestamp()
    : new Date(),
```

### ❌ Lo que NUNCA debe hacerse:
- Llamar a `db.collection('triajes').add()` sin verificar `firebase.auth().currentUser`
- Usar `firebase.firestore.FieldValue.serverTimestamp()` sin guard `typeof`
- Requerir login para el flujo de autotriaje del paciente

### ✅ Lo que SÍ puede hacerse:
- Si el usuario YA está logueado, guardar en Firestore (mejor experiencia)
- Si NO está logueado, codificar en URL (funciona igual, sin errores)

---
**Error que se produce sin este fix:**
```
Error: Missing or insufficient permissions.
```
Causa: Firestore rechaza escrituras de usuarios no autenticados en la colección `triajes`.

**Autor**: Carlos Galera · Abril 2026
**Archivos afectados**: `app-modules.js` (buscar `trClasGenerarQR` y `trIASaveAndShowQR`)

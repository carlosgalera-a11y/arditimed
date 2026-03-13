# 🔥 CONFIGURACIÓN FIREBASE - Guía Paso a Paso

**Objetivo:** Habilitar login con Gmail + base de datos para el tablón de notas

**Tiempo:** ~10 minutos  
**Coste:** $0 (FREE tier)

---

## 📋 Paso 1: Crear Proyecto Firebase

### 1.1 Ir a Firebase Console
```
https://console.firebase.google.com
```

### 1.2 Clickear "Agregar Proyecto"
```
[+ Agregar Proyecto]
```

### 1.3 Nombre del Proyecto
```
Nombre: cartagena-este
Región: Europa (Spain) ✅
Plan: FREE ✅
```

### 1.4 Esperar a que se cree (2-3 minutos)
```
⏳ Creando proyecto...
✅ Proyecto creado exitosamente
```

---

## 🔐 Paso 2: Agregar Aplicación Web

### 2.1 Ir a Configuración del Proyecto
```
⚙️ Configuración → Configuración del Proyecto
```

### 2.2 Seleccionar App Web
```
En "Aplicaciones": Click en </> (Web)
```

### 2.3 Registrar App
```
Nombre de la app: Cartagena Este Webapp
☑️ Configurar também Firebase Hosting
```

### 2.4 Copiar Config (IMPORTANTE)
Se te mostrará código como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD9c...",
  authDomain: "cartagena-este.firebaseapp.com",
  projectId: "cartagena-este",
  storageBucket: "cartagena-este.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

**⭐ GUARDA ESTOS VALORES - LOS NECESITARÁS**

---

## 🛢️ Paso 3: Activar Firestore Database

### 3.1 Ir a Firestore
```
Panel Izquierdo: Build → Firestore Database
```

### 3.2 Crear Database
```
[Crear Base de Datos]
```

### 3.3 Configuración
```
Ubicación: Europe (es)
Modo de seguridad: INICIAR EN MODO PRUEBA ✅
[Siguiente] → [Habilitar]
```

### 3.4 Esperar (30 segundos)
```
✅ Base de datos creada
```

---

## 👤 Paso 4: Activar Google Authentication

### 4.1 Ir a Authentication
```
Panel Izquierdo: Build → Authentication
```

### 4.2 Activar Google Sign-In
```
[Comenzar] → Métodos de Inicio de Sesión
[Google] → Toggle ON ✅
Email de Soporte: (tu gmail)
[Guardar]
```

### 4.3 Configurar OAuth Consent Screen
Se redirige a Google Cloud Console:

```
1. Selecciona: Externo
2. Acepta términos
3. Rellena:
   - Nombre: Cartagena Este
   - Email de soporte: tu@email.com
   - Datos de contacto: tu@email.com
4. [Guardar y Continuar]
5. Agrega Scopes (si pide):
   - email
   - profile
   - openid
6. [Guardar y Continuar]
7. [Ir a Panel de Control]
```

---

## 🔑 Paso 5: Integrar Config en Código

### 5.1 Abre la carpeta del proyecto
```bash
cd cartagena-este-webapp
```

### 5.2 Edita `informacion.html`
```bash
# Busca línea ~100
const firebaseConfig = {
  apiKey: "AIzaSyD9c-EXAMPLE-KEY-CHANGE-ME",  ← REEMPLAZA
  ...
};
```

### 5.3 Reemplaza con TU configuración
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD9c-TU-CLAVE-AQUI",           ← Tu apiKey
  authDomain: "cartagena-este.firebaseapp.com", ← Tu authDomain
  projectId: "cartagena-este",                  ← Tu projectId
  storageBucket: "cartagena-este.appspot.com",  ← Tu storageBucket
  messagingSenderId: "123456789",               ← Tu messagingSenderId
  appId: "1:123456789:web:abc..."               ← Tu appId
};
```

### 5.4 Copia la misma config a TODOS los archivos
```
informacion.html
factores-riesgo.html
ejercicios.html
enlaces-interes.html
vacunas.html
programacion.html
dejar-fumar.html
podcast.html
```

**Tip:** Busca y reemplaza la línea completa en todos

---

## 🔒 Paso 6: Configurar Reglas de Firestore

### 6.1 Ir a Firestore Rules
```
Firestore Database → [Rules]
```

### 6.2 Copiar estas reglas
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notas: solo propietario puede editar/borrar, todos pueden leer
    match /notas/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.autorId;
    }
  }
}
```

### 6.3 Publicar
```
[Publicar]
```

---

## ✅ Paso 7: Probar

### 7.1 Abre una página
```
http://localhost:8000/informacion.html
```

### 7.2 Click "Acceder con Gmail"
```
[📧 Acceder con Gmail]
```

### 7.3 Se abrirá diálogo de Google
```
Selecciona tu cuenta
Autoriza permisos
✅ ¡Debería funcionar!
```

### 7.4 Escribe una nota de prueba
```
Título: "Test"
Contenido: "Mi primera nota"
[➕ Publicar Nota]
```

### 7.5 Verifica en Firestore
```
Firebase Console → Firestore Database
Debería haber una colección "notas" con tu documento
```

---

## 🚀 Paso 8: Deploy a GitHub Pages

### 8.1 Commit los cambios
```bash
cd cartagena-este-webapp
git add informacion.html factores-riesgo.html ... (todos los .html)
git commit -m "🔥 Integrar Firebase Config"
```

### 8.2 Push a GitHub
```bash
git push origin main:gh-pages
```

### 8.3 Verifica en GitHub Pages
```
https://carlosgalera-a11y.github.io/Cartagenaeste/informacion.html
[📧 Acceder con Gmail]
```

---

## 🐛 Troubleshooting

### Problema: "Error en login"
**Solución:**
- Verifica que Google Sign-In está activo en Firebase
- Verifica que la apiKey es correcta
- Limpia cookies/caché del navegador

### Problema: "Error cargando notas"
**Solución:**
- Verifica que Firestore está creado
- Verifica que las reglas están publicadas
- Abre DevTools (F12) y mira la consola

### Problema: "No puedo editar/borrar notas"
**Solución:**
- Verifica que iniciaste sesión con Gmail
- Solo el propietario de la nota puede editarla
- Verifica las reglas de Firestore

### Problema: "Recibo CORS error"
**Solución:**
- Esto es normal en desarrollo local
- En GitHub Pages funcionará sin problema

---

## 📚 Estructura Firestore

Después de agregar notas, tu base de datos se verá así:

```
cartagena-este (Database)
└── notas (Collection)
    └── doc1 (Document)
        ├── categoria: "informacion"
        ├── titulo: "Test"
        ├── contenido: "Mi primera nota"
        ├── autor: "usuario@gmail.com"
        ├── autorId: "uid123..."
        ├── createdAt: Timestamp
        └── updatedAt: Timestamp
```

---

## 🔐 Seguridad

**Lo que está protegido:**
- ✅ Solo usuarios autenticados pueden crear notas
- ✅ Solo el propietario puede editar/borrar
- ✅ Todos pueden ver las notas (público)
- ✅ Las notas se asocian al UID de Google

**Para mayor seguridad (futuro):**
- Implementar verificación de email
- Roles de administrador
- Moderación de contenido

---

## 📞 Preguntas?

**Firebase Docs:** https://firebase.google.com/docs
**Google Console:** https://console.cloud.google.com
**Soporte OpenClaw:** En el workspace

---

## ✅ Checklist Final

- [ ] Proyecto Firebase creado
- [ ] Firestore Database activado
- [ ] Google Authentication configurado
- [ ] Config copiada en todos los HTML
- [ ] Firestore Rules publicadas
- [ ] Probado en localhost
- [ ] Commits y push completados
- [ ] ✅ ¡LISTO!

---

_Guía creada: 19 Feb 2026 18:40 GMT+1_  
_Para: Centro de Salud Cartagena Este_  
_Por: Arditi (Agent de automatización médica) 🦞_

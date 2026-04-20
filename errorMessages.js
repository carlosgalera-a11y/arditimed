// errorMessages.js — Mapea códigos de error a mensajes user-friendly en español.
// Uso: import { getErrorMessage } from './errorMessages.js' o window.getErrorMessage(error).
// NUNCA mostrar stack trace ni código técnico al usuario final.
(function(global){
  'use strict';

  var MAP = {
    // ── Firebase Auth ─────────────────────────────────────────────
    'auth/wrong-password':              'Contraseña incorrecta. Inténtalo de nuevo.',
    'auth/invalid-password':            'Contraseña incorrecta. Inténtalo de nuevo.',
    'auth/user-not-found':              'No existe una cuenta con ese email.',
    'auth/email-already-in-use':        'Ya existe una cuenta con ese email. Inicia sesión.',
    'auth/invalid-email':               'El email no tiene un formato válido.',
    'auth/weak-password':               'La contraseña es demasiado débil (mínimo 6 caracteres).',
    'auth/too-many-requests':           'Demasiados intentos. Inténtalo de nuevo en unos minutos.',
    'auth/network-request-failed':      'Sin conexión a internet. Comprueba tu red.',
    'auth/popup-closed-by-user':        'Has cerrado la ventana de login antes de completar.',
    'auth/cancelled-popup-request':     'Se canceló el inicio de sesión.',
    'auth/popup-blocked':               'El navegador bloqueó el popup. Permite popups para esta web.',
    'auth/invalid-credential':          'Las credenciales son inválidas o han expirado.',
    'auth/account-exists-with-different-credential':
                                        'Ya tienes una cuenta con otro método. Inicia con el método original.',
    'auth/requires-recent-login':       'Por seguridad, vuelve a iniciar sesión para realizar esta acción.',

    // ── Cloud Functions (HttpsError) ──────────────────────────────
    'functions/unauthenticated':        'Inicia sesión para usar la IA.',
    'functions/permission-denied':      'No tienes permiso para esta acción.',
    'functions/resource-exhausted':     'Has alcanzado tu límite diario. Vuelve mañana.',
    'functions/unavailable':            'Servicio IA temporalmente no disponible. Reintenta en 1 minuto.',
    'functions/deadline-exceeded':      'La IA tardó demasiado. Reintenta.',
    'functions/invalid-argument':       'Los datos enviados no son válidos.',
    'functions/not-found':              'El recurso solicitado no existe.',
    'functions/failed-precondition':    'Verificación de seguridad fallida. Recarga la página.',
    'functions/internal':               'Error interno del servicio. Reintenta en unos minutos.',

    // ── Firestore ─────────────────────────────────────────────────
    'permission-denied':                'No tienes permiso para acceder a estos datos.',
    'unavailable':                      'Servicio temporalmente no disponible. Reintenta.',
    'unauthenticated':                  'Inicia sesión para continuar.',
    'not-found':                        'No encontrado.',
    'already-exists':                   'Ya existe un elemento con esos datos.',
    'deadline-exceeded':                'La operación tardó demasiado. Reintenta.',

    // ── Red / offline ─────────────────────────────────────────────
    'offline':                          'Estás sin conexión. Algunos datos pueden no estar al día.',
    'timeout':                          'Esto está tardando más de lo normal. Espera o reintenta.',
  };

  function normalize(code){
    if (!code) return null;
    code = String(code);
    // Firebase errors: 'functions/unauthenticated' o 'auth/wrong-password'
    // Firestore errors: 'permission-denied', etc.
    if (MAP[code]) return code;
    // Extraer sufijo si hay prefix
    var idx = code.lastIndexOf('/');
    if (idx >= 0 && MAP[code.substring(idx+1)]) return code.substring(idx+1);
    return null;
  }

  function getErrorMessage(err){
    if (!err) return 'Error desconocido.';
    if (typeof err === 'string') return MAP[err] || err;
    var code = err.code || err.name || '';
    var key = normalize(code);
    if (key && MAP[key]) return MAP[key];
    // userMessage lo setea ai-client.js en HttpsError
    if (err.userMessage) return err.userMessage;
    // message genérico pero sin stack
    if (err.message && err.message.length < 200) return err.message;
    return 'Ha ocurrido un error inesperado. Reintenta.';
  }

  global.getErrorMessage = getErrorMessage;
  global.errorMessages = { map: MAP, get: getErrorMessage };
})(typeof window !== 'undefined' ? window : globalThis);

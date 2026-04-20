# Contributing · Cartagenaeste

Gracias por tu interés. La colaboración externa está **sujeta a autorización previa** del titular de la IP (ver [LICENSE](LICENSE)). Si has llegado aquí es porque Carlos Galera Román te ha invitado o ha aprobado tu propuesta.

## Antes de contribuir

1. **Firma un CLA** (Contributor License Agreement) que preserve la titularidad del autor principal. Plantilla disponible a petición.
2. **Email previo**: carlosgalera2roman@gmail.com asunto `[CONTRIBUTOR]` explicando:
   - Ámbito de colaboración (código, clínico, docs).
   - Frecuencia esperada.
   - Conflictos de interés (empleo, relación con farma, etc.).

## Convenciones de commits

Usa **Conventional Commits** (https://www.conventionalcommits.org/):

```
<tipo>(<ámbito opcional>): <descripción corta en minúscula>

<cuerpo explicativo, 72 chars por línea>

<footers, p.ej. Co-Authored-By:>
```

Tipos aceptados:
- `feat` — nueva funcionalidad
- `fix` — arreglo de bug
- `docs` — solo documentación
- `refactor` — no cambia comportamiento
- `test` — añade/corrige tests
- `chore` — tareas de mantenimiento
- `security` — arreglos de seguridad
- `perf` — mejoras de rendimiento
- `style` — formato, linting, sin cambios funcionales

Ejemplos:
```
feat(askai): añadir fallback Mistral para clinical_case
fix(sw): corregir cache stuck en versión v74
security(rules): endurecer validación DNI en cases.notes
```

## Branches

Nomenclatura:
- `feature/<slug>` — nuevas funcionalidades
- `fix/<slug>` — correcciones
- `chore/<slug>` — mantenimiento / docs
- `refactor/<slug>` — sin cambios de comportamiento
- `security/<slug>` — arreglos de seguridad

Nunca trabajar directamente sobre `main`. `main` está protegida (o debería estarlo).

## Proceso de Pull Request

1. Crea la rama local: `git checkout -b feature/mi-cambio`.
2. Haz commits siguiendo las convenciones.
3. `git push -u origin feature/mi-cambio`.
4. Abre PR contra `main` usando la plantilla `.github/PULL_REQUEST_TEMPLATE.md`.
5. Incluye:
   - Qué cambia y por qué.
   - Cómo probarlo.
   - Capturas si afecta UI.
6. Espera review de Carlos. CI debe pasar antes de merge.
7. Merge estrategia: **merge commit** (preserva historia).
8. Borrar rama remota tras merge.

## Correr tests localmente

```bash
cd functions
npm install
npm test            # unit tests + coverage
# Para rules tests hace falta el emulador Firestore corriendo:
firebase emulators:start --only firestore --project demo-rules-test
# en otra terminal:
npm run test:rules
```

## Linting

```bash
cd functions
npm run lint        # no fail en warnings
```

Pre-commit hook (opcional): `husky + lint-staged` corre eslint + prettier + gitleaks protect sobre archivos modificados.

## Seguridad

Si encuentras una vulnerabilidad **NO abras un issue público**. Ver [SECURITY.md](SECURITY.md).

## Estilo de código

- **HTML/JS frontend**: vanilla, sin bundlers. Estilo existente (funciones cortas, helpers). No introducir React/Vue/Svelte.
- **TypeScript `functions/`**: strict mode, `noUnusedLocals`, `noImplicitReturns`.
- **Cobertura mínima tests unitarios**: 70% líneas / 60% functions. Rules tests son adicionales.

## Código de conducta

Ver [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Contacto

Dudas sobre procesos: carlosgalera2roman@gmail.com asunto `[CONTRIBUTOR]`.

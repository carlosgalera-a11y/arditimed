# Paratus Medical — Bundle completo

Generado: 2026-04-17T02:03:53.908Z

## Contenido

### `web/`
- `urgencias_ambulancias_camas.html` — visor autocontenido, tema oscuro/ámbar (UI en español)
- `docencia.html` — mismo visor con tema claro
- `VERIFICACION.html` — reporte auditable por entorno y categoría

### `data/`
- `paratus_all.json` — JSON maestro (los 3 entornos)
- `adult/`, `pediatric/`, `neonatal/` cada uno con:
  - `[env].json`
  - `conditions/*.md` — un MD por indicación con tabs resueltos y referencias
  - `procedures/*.md`
  - `drugs/*.md` — monografía por fármaco con todos los steps y dosis
  - `drugs.csv` — tabla plana con 24 columnas
  - `condition_to_drugs.txt`, `drug_to_conditions.txt`
  - `references.txt`
  - `conditions_list.txt`, `procedures_list.txt`

## Totales
- Adulto: 52 condiciones · 45 procedimientos · 143 fármacos
- Pediátrico: 38 condiciones · 13 procedimientos · 184 fármacos
- Neonatal: 3 condiciones · 13 procedimientos · 33 fármacos
- Indicaciones totales: 208 · Tabs resueltos: 348 · Dosing steps: 989 · Filas de dosis: 1674

## Cómo publicarlo en tu web (lo haces TÚ)

No tengo permisos para autenticarme en tu cuenta de GitHub ni en Google Sites. Pasos:

1. Abre https://github.com/carlosgalera-a11y/Cartagenaeste (ya logueado).
2. **Add file → Upload files**.
3. Sube `web/urgencias_ambulancias_camas.html`, `web/docencia.html` y `web/VERIFICACION.html` a la raíz del repo (o a una carpeta).
4. Commit.
5. URLs finales:
   - https://carlosgalera-a11y.github.io/Cartagenaeste/urgencias_ambulancias_camas.html
   - https://carlosgalera-a11y.github.io/Cartagenaeste/docencia.html
   - https://carlosgalera-a11y.github.io/Cartagenaeste/VERIFICACION.html

Enlace desde tu tile "Urgencias · Ambulancias · Camas":
```html
<a href="urgencias_ambulancias_camas.html">Urgencias · Ambulancias · Camas</a>
```

## Aviso legal

Contenido extraído de la app **Paratus Medical** (app.paratusmedical.com) con fines educativos. Material informativo; NO sustituye el juicio clínico. Antes de publicar verifica si la redistribución es compatible con los términos de uso de Paratus Medical.

## Recordatorio de seguridad

El token `ghp_...` que pegaste durante la conversación quedó expuesto. Revócalo en https://github.com/settings/tokens si aún no lo has hecho.

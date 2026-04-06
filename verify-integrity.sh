#!/bin/bash
# ═══ VERIFICADOR DE INTEGRIDAD ═══
# Ejecutar antes de cada push para asegurar que nada se ha roto
ERRORS=0

echo "🔍 Verificando integridad de Cartagenaeste..."

# ── PROFESIONALES: documentos embebidos en app-main.js ──
DOCS=$(grep -o "size_mb" app-main.js | wc -l)
if [ "$DOCS" -lt 100 ]; then
  echo "❌ PROFESIONALES: Solo $DOCS docs en app-main.js (esperados 131+)"
  ERRORS=$((ERRORS+1))
else
  echo "✅ PROFESIONALES: $DOCS documentos en app-main.js"
fi

# ── PACIENTES: cada página debe tener contenido y NO tener login gate ni notas ──
PACIENTES_FILES="factores-riesgo.html ejercicios.html dejar-fumar.html enlaces-interes.html vacunas.html podcast.html"
for f in $PACIENTES_FILES; do
  if [ ! -f "$f" ]; then echo "❌ $f NO EXISTE"; ERRORS=$((ERRORS+1)); continue; fi
  LINES=$(wc -l < "$f")
  NOTAS=$(grep -c "Añadir Nota" "$f")
  ACCESO=$(grep -c "Acceso Restringido" "$f")
  BODY=$(grep -c "</body>" "$f")
  HOME=$(grep -c "floatingHomeBtn" "$f")
  
  if [ "$LINES" -lt 500 ]; then echo "❌ $f: solo ${LINES} líneas (contenido borrado?)"; ERRORS=$((ERRORS+1))
  elif [ "$NOTAS" -gt 0 ]; then echo "❌ $f: tiene Añadir Nota (debería estar eliminado)"; ERRORS=$((ERRORS+1))
  elif [ "$ACCESO" -gt 0 ]; then echo "❌ $f: tiene Acceso Restringido (debería estar eliminado)"; ERRORS=$((ERRORS+1))
  elif [ "$HOME" -eq 0 ]; then echo "⚠️  $f: falta botón Inicio"; 
  else echo "✅ $f: ${LINES}L OK"; fi
done

# ── VACUNAS: buscador por edad ──
VAC_SEARCH=$(grep -c "buscarVacunas" vacunas.html)
if [ "$VAC_SEARCH" -eq 0 ]; then echo "❌ vacunas.html: falta buscador por edad"; ERRORS=$((ERRORS+1))
else echo "✅ vacunas.html: buscador por edad presente"; fi

# ── ENLACES: cartagenaeste.es ──
CART=$(grep -c "cartagenaeste.es" enlaces-interes.html)
if [ "$CART" -eq 0 ]; then echo "❌ enlaces-interes.html: falta cartagenaeste.es"; ERRORS=$((ERRORS+1))
else echo "✅ enlaces-interes.html: cartagenaeste.es presente"; fi

# ── KEYS: _xd definida globalmente ──
XD_GLOBAL=$(head -60 app-main.js | grep -c "function _xd")
if [ "$XD_GLOBAL" -eq 0 ]; then echo "❌ app-main.js: _xd no está en scope global"; ERRORS=$((ERRORS+1))
else echo "✅ app-main.js: _xd en scope global"; fi

# ── RESULTADO ──
echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "🎉 TODO OK — seguro para hacer push"
else
  echo "🚨 $ERRORS ERRORES — NO hacer push hasta corregir"
fi
exit $ERRORS

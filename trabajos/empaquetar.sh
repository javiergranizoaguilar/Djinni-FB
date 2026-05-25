#!/usr/bin/env bash
# Genera el archivo comprimido de entrega.
# Ejecutar desde la raiz del repo o desde trabajos/.

set -e
cd "$(dirname "$0")/.."

OUT="djinni-fb-entrega-final.zip"
rm -f "$OUT"

echo "==> Comprobando que no quedan marcadores [FALTA:]"
COUNT=$(grep -rn "FALTA:" trabajos/memoria/ trabajos/presentacion/ 2>/dev/null | wc -l)
if [ "$COUNT" -gt 0 ]; then
    echo "    AVISO quedan $COUNT marcadores [FALTA:] en memoria/presentacion."
    grep -rn "FALTA:" trabajos/memoria/ trabajos/presentacion/ 2>/dev/null | head -20
    echo "    Rellenalos y vuelve a ejecutar este script."
    exit 1
fi

echo "==> Generando $OUT"
zip -r "$OUT" . \
    -x "Djinni-B/vendor/*" \
    -x "Djinni-B/var/cache/*" \
    -x "Djinni-B/var/log/*" \
    -x "Djinni-B/.env.local" \
    -x "Djinni-B/bin/workerman.log" \
    -x "Djinni-B/bin/workerman.console.pid" \
    -x "Djinni-B/config/jwt/private.pem" \
    -x "Djinni-B/config/jwt/public.pem" \
    -x "Djinni-F/node_modules/*" \
    -x "Djinni-F/dist/*" \
    -x "Djinni-F/vite.log" \
    -x "Djinni-F/.env" \
    -x ".git/*" \
    -x ".vscode/*" \
    -x ".idea/*" \
    -x "*/.DS_Store" \
    -x "$OUT" \
    > /dev/null

SIZE=$(du -h "$OUT" | cut -f1)
echo "==> Listo: $OUT ($SIZE)"
echo ""
echo "Contenido del zip:"
unzip -l "$OUT" | tail -5

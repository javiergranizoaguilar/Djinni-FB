#!/usr/bin/env bash
# Genera todos los PDFs/PPTX de la entrega final a partir de los Markdown
# en trabajos/entregas/fuentes/. Usa npx para no instalar nada global.
#
# Requiere: node, npx y google-chrome (o chromium) en PATH.
# Sin sudo.

set -e

cd "$(dirname "$0")"
SRC="fuentes"
OUT="."

echo "==> Comprobando herramientas"
command -v npx >/dev/null || { echo "FALTA npx (instala node 20)"; exit 1; }
CHROME=$(command -v google-chrome || command -v chromium || command -v chrome || true)
[ -n "$CHROME" ] || { echo "FALTA chromium/google-chrome"; exit 1; }
echo "    npx: $(command -v npx)"
echo "    chrome: $CHROME"

echo ""
echo "==> 1/3 Renderizando diagramas Mermaid a PNG"
for diag in "$SRC"/diagramas/*.mmd; do
    name=$(basename "$diag" .mmd)
    echo "    -> $name.png"
    npx -y -p @mermaid-js/mermaid-cli mmdc \
        -i "$diag" \
        -o "$SRC/diagramas/$name.png" \
        -b transparent \
        -w 1600 \
        --quiet 2>&1 | tail -3 || true
done

echo ""
echo "==> 2/3 Renderizando memoria.pdf"
# md-to-pdf usa puppeteer que descarga su propio chrome. Para usar el del
# sistema le pasamos PUPPETEER_EXECUTABLE_PATH.
export PUPPETEER_EXECUTABLE_PATH="$CHROME"
export PUPPETEER_SKIP_DOWNLOAD=true
npx -y md-to-pdf "$SRC/memoria.md" \
    --launch-options '{"args":["--no-sandbox","--disable-dev-shm-usage"]}' \
    --pdf-options '{"format":"A4","margin":{"top":"25mm","right":"22mm","bottom":"25mm","left":"22mm"},"printBackground":true}' \
    --stylesheet-encoding utf-8 2>&1 | tail -5 || true
[ -f "$SRC/memoria.pdf" ] && mv "$SRC/memoria.pdf" "$OUT/memoria.pdf" && echo "    OK $OUT/memoria.pdf" || echo "    FALLO memoria.pdf"

echo ""
echo "==> 3/3 Renderizando presentacion (PDF + PPTX)"
npx -y -p @marp-team/marp-cli marp \
    "$SRC/presentacion.md" \
    --pdf \
    --allow-local-files \
    -o "$OUT/presentacion.pdf" 2>&1 | tail -3 || true

npx -y -p @marp-team/marp-cli marp \
    "$SRC/presentacion.md" \
    --pptx \
    --allow-local-files \
    -o "$OUT/presentacion.pptx" 2>&1 | tail -3 || true

[ -f "$OUT/presentacion.pdf" ] && echo "    OK $OUT/presentacion.pdf" || echo "    FALLO presentacion.pdf"
[ -f "$OUT/presentacion.pptx" ] && echo "    OK $OUT/presentacion.pptx" || echo "    FALLO presentacion.pptx"

echo ""
echo "==> Diagramas como PNG sueltos (utiles si se pegan a otros docs)"
cp "$SRC"/diagramas/*.png "$OUT/" 2>/dev/null || true
ls "$OUT"/*.png 2>/dev/null || true

echo ""
echo "==> Contenido final de entregas/:"
ls -la "$OUT" | grep -v "^d"

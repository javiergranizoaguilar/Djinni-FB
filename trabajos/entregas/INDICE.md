# Carpeta de entrega final

Esta carpeta contiene los entregables del TFG en su forma final, listos
para subir a la plataforma del centro y para empaquetar dentro del zip
junto con el codigo fuente.

## Contenido

| Archivo | Que es | Como se genera |
|---|---|---|
| `memoria.pdf` | Memoria tecnica del proyecto (40-50 paginas aprox.) | `generar.sh` |
| `presentacion.pdf` | Diapositivas de la defensa, formato 16:9 | `generar.sh` |
| `presentacion.pptx` | Misma presentacion en PowerPoint editable | `generar.sh` |
| `arquitectura.png` | Diagrama de arquitectura para meter en otros sitios | `generar.sh` |
| `er.png` | Diagrama Entidad-Relacion | `generar.sh` |
| `fuentes/` | Markdown originales por si necesitas editar | Ya copiados |

## Como regenerar los PDFs

Desde la raiz del repo:

```
cd trabajos/entregas
bash generar.sh
```

Tarda 2-3 minutos la primera vez (npx descarga marp y mermaid-cli al cache de npm).
La segunda vez es casi instantaneo.

Requisitos: `node` >= 20, `npx` y `google-chrome` o `chromium` en PATH.
No necesita sudo.

## Que entregar al centro

Segun el enunciado (seccion 2):

1. Archivo comprimido (`.zip` o `.tar.gz`) con el codigo fuente sin
   `vendor/` ni `node_modules/`. Lo genera `trabajos/empaquetar.sh`
   desde la raiz del repo, e incluye esta carpeta `entregas/`.
2. `memoria.pdf` y `presentacion.pdf` o `presentacion.pptx`.

El zip y los dos PDFs son lo unico que el tribunal necesita ver. La
demo en vivo se hace con `docker compose up -d` desde el zip
descomprimido y un navegador.

## Que falta por hacer antes de subir

- [ ] Compilar PDFs (`bash generar.sh`).
- [ ] Verificar el smoke test del Docker (`sudo bash ../verificar.sh`).
- [ ] Empaquetar el zip (`sudo bash ../empaquetar.sh` desde la raiz).
- [ ] Subir zip y PDFs a donde indique el centro.
- [ ] Ensayar la demo de 6 minutos al menos dos veces.

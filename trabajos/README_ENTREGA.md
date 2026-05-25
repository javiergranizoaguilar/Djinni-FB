# Indice de la entrega final del TFG

## Contenido

- `memoria/memoria.md` — Memoria tecnica del proyecto en Markdown. Documento maestro con descripcion, arquitectura, modelo de datos, especificaciones tecnicas, manual de despliegue y conclusiones.
- `memoria/diagramas/arquitectura.mmd` — Diagrama de arquitectura de alto nivel en Mermaid `flowchart`.
- `memoria/diagramas/er.mmd` — Diagrama Entidad-Relacion en Mermaid `erDiagram`.
- `presentacion/presentacion.md` — Diapositivas de la defensa en formato Marp 16:9.
- `presentacion/demo_script.md` — Guion paso a paso de la demostracion en vivo de 6 minutos.
- `screenshots/` — Capturas de la entrega parcial de abril (autenticacion y BD).
- `ejercicio_tfg_parte1.pdf` — Enunciado de la entrega parcial.
- `entrega_parte1.pdf` — Entrega parcial de abril.
- `enunciado_tfg_final_actualizado.pdf` — Enunciado de la entrega final.

## Como compilar los entregables a PDF

### Memoria

Con `pandoc` y un motor LaTeX (`xelatex` recomendado):

```
pandoc trabajos/memoria/memoria.md \
  -o trabajos/memoria/memoria.pdf \
  --pdf-engine=xelatex \
  --toc
```

Alternativa sin LaTeX (HTML -> PDF con Chromium):

```
pandoc trabajos/memoria/memoria.md -o trabajos/memoria/memoria.html --standalone --toc
chromium --headless --disable-gpu --print-to-pdf=trabajos/memoria/memoria.pdf trabajos/memoria/memoria.html
```

### Diagramas

Con `@mermaid-js/mermaid-cli` (`mmdc`):

```
mmdc -i trabajos/memoria/diagramas/arquitectura.mmd -o trabajos/memoria/diagramas/arquitectura.png
mmdc -i trabajos/memoria/diagramas/er.mmd -o trabajos/memoria/diagramas/er.png
```

Si la memoria se va a imprimir, conviene regenerar los PNG primero y ajustar las rutas en la presentacion antes de exportar.

### Presentacion

Con `@marp-team/marp-cli`:

```
marp trabajos/presentacion/presentacion.md -o trabajos/presentacion/presentacion.pdf
marp trabajos/presentacion/presentacion.md -o trabajos/presentacion/presentacion.pptx
```

## Como empaquetar el zip de entrega

Desde la raiz del repositorio:

```
zip -r djinni-fb-entrega-final.zip . \
  -x "Djinni-B/vendor/*" \
  -x "Djinni-F/node_modules/*" \
  -x "Djinni-F/dist/*" \
  -x "Djinni-B/var/cache/*" \
  -x "Djinni-B/var/log/*" \
  -x ".git/*"
```

El zip resultante contiene el codigo fuente sin `vendor/` ni `node_modules/`, los entregables de `trabajos/` y el `docker-compose.yaml` raiz con sus archivos de soporte en `docker/`.

## Que se entrega y donde aparece en el enunciado

| Entregable | Archivo | Seccion del enunciado |
|---|---|---|
| Codigo fuente comprimido | `djinni-fb-entrega-final.zip` | Seccion 2 |
| Memoria tecnica en PDF | `trabajos/memoria/memoria.pdf` | Seccion 2.1 |
| Presentacion de defensa | `trabajos/presentacion/presentacion.pdf` o `.pptx` | Seccion 2.2 |
| Diagrama de arquitectura | `trabajos/memoria/diagramas/arquitectura.{mmd,png}` | Seccion 2.1 |
| Diagrama E/R | `trabajos/memoria/diagramas/er.{mmd,png}` | Seccion 2.1 |
| Manual de despliegue | Seccion 5 de `memoria.md` | Seccion 2.1 |
| Guion de la demo | `trabajos/presentacion/demo_script.md` | Seccion 3.1 punto 4 |

## Datos que faltan por rellenar antes de entregar

La memoria y la presentacion contienen marcadores `[FALTA: ...]` en los lugares donde necesito que rellenes datos personales. Hacer una pasada de `grep -rn "FALTA"` antes de compilar a PDF.

Lista de huecos:

- Nombre completo del autor.
- Titulacion exacta.
- Nombre del centro.
- Nombre del tutor o tutora.
- Curso academico.
- Fecha y hora de defensa.
- Email de contacto en la diapositiva final.

## Smoke test del stack Docker

El stack Docker se genero durante la entrega final. **Pasa la validacion de sintaxis (`docker compose config`) y la build (`docker compose build`)**, pero el arranque completo no se probo end-to-end durante la sesion porque el usuario que escribio el entregable no estaba en el grupo `docker` y no tenia acceso a `sudo` sin contrasena.

Antes de entregar el zip, ejecutar:

```
bash trabajos/verificar.sh
```

El script tira cualquier stack previo, levanta los cinco contenedores en frio, espera a que migraciones y datos demo se carguen, prueba el endpoint de login y comprueba que el frontend responde. Si pasa, la entrega esta lista. Si falla, los logs de `docker compose logs djinni_php` y `docker compose logs djinni_ws` dan la pista.

Para empaquetar el zip de entrega:

```
bash trabajos/empaquetar.sh
```

## Verificacion antes de entregar

1. Rellenar todos los `[FALTA: ...]`.
2. Compilar `memoria.md` a PDF y revisar la paginacion y los saltos.
3. Compilar `presentacion.md` a PDF y a PPTX. Revisar que las imagenes de Mermaid no se exceden de la diapositiva.
4. Hacer `docker compose down -v && docker compose up -d` en limpio, esperar a que arranque y probar el login con los dos usuarios demo.
5. Empaquetar el zip y comprobar que no contiene `vendor/`, `node_modules/`, `.git/` ni archivos `.env.local` con secretos reales.

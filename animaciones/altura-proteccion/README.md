# Animación · Altura de protección (AquaLOCK®)

Sección de la web: **"¿Por qué importa la altura de protección?"**
Estilo: dibujo técnico isométrico, minimal y premium. Colores de la web (`#313134`, `#728AFB`, `#FF914D`), tipografía Archivo.
Loop de 10 s: la escena se dibuja → el agua sube de 0 a 1,60 m → la puerta lo contiene y el interior queda seco → fundido y repite.

## Archivos

| Archivo | Para qué |
|---|---|
| `altura-proteccion.js` | Animación en vivo (SVG + JS, ~25 KB, sin dependencias) |
| `altura-proteccion.html` | Página suelta con la animación (para un `<iframe>` o para abrir directo) |
| `preview-web-AguaBarrera.html` | Copia del wireframe con la animación ya puesta en la sección |
| `export/altura-proteccion_2400x1000.mp4` | Video alta resolución, mismo formato que la web |
| `export/altura-proteccion_1920x1080.mp4` | Video 16:9 para presentaciones |
| `export/altura-proteccion_web_1200x500.mp4` / `.webm` | Video liviano para usar como `<video>` en la web |
| `export/altura-proteccion_960x400.gif` | GIF para mails o mensajería |
| `export/altura-proteccion_poster_2400x1000.png` | Cuadro final (imagen fija / poster) |

## Cómo ponerla en la web

**Opción A, recomendada (animación en vivo, nítida, ~25 KB):** reemplazar el `<img>` de la figura por:

```html
<div class="fig-media">
  <svg class="aq-altura" style="display:block;width:100%;height:auto"></svg>
</div>
<script src="altura-proteccion.js" defer></script>
```

Arranca sola cuando la sección entra en pantalla, se pausa fuera de pantalla y respeta "reducir movimiento" (muestra el cuadro final fijo).
Los rótulos ya están dentro de la animación, así que los `fig-label` de la imagen anterior se pueden quitar.

**Opción B (video):**

```html
<video autoplay muted loop playsinline poster="altura-proteccion_poster_2400x1000.png" style="width:100%;display:block">
  <source src="altura-proteccion_web_1200x500.webm" type="video/webm">
  <source src="altura-proteccion_web_1200x500.mp4" type="video/mp4">
</video>
```

## Volver a exportar los videos

```bash
node render-video.js <carpeta-frames> 1200 500 30 2
ffmpeg -framerate 30 -i <carpeta-frames>/%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p salida.mp4
```

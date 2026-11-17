# Animación 3D · Altura de protección (AquaLOCK®)

Sección de la web: **"¿Por qué importa la altura de protección?"**

Escena de maqueta arquitectónica: una casa moderna con el garaje en corte y la puerta AquaLOCK® como protagonista.
Loop de 10 s, con un giro de cámara sutil:
1. El agua sube de 0 a 1,60 m.
2. Cubre el coche y llega a los hombros de la persona.
3. El sello de la puerta se ilumina y el interior del garaje queda seco.
4. El agua baja y la animación vuelve a empezar.

## Archivos

| Archivo | Para qué |
|---|---|
| `altura-proteccion-3d.html` | Página suelta con la animación en vivo (sirve para un `<iframe>`) |
| `altura-proteccion-3d.js` + `vendor/` | Código de la escena (Three.js 0.169, unos 200 KB comprimido) |
| `preview-web-AguaBarrera.html` | Copia del wireframe con la animación puesta en la sección |
| `export/altura-proteccion-3d_2400x1000.mp4` | Video en alta resolución, con el formato de la web |
| `export/altura-proteccion-3d_1920x1080.mp4` | Video 16:9 para presentaciones |
| `export/altura-proteccion-3d_web_1200x500.mp4` / `.webm` | Video liviano para usar como `<video>` en la web |
| `export/altura-proteccion-3d_960x400.gif` | GIF para mails o mensajería |
| `export/altura-proteccion-3d_poster_2400x1000.png` | Imagen fija del cuadro final |
| `cuadros-de-estilo/` | Las imágenes fijas que se aprobaron |

> La versión en vivo usa módulos JS: hay que abrirla desde un servidor (la web real, o `npx serve` en local), no con doble clic (`file://`).

## Cómo ponerla en la web

**Opción A, recomendada (video, máxima compatibilidad):**

```html
<video autoplay muted loop playsinline poster="altura-proteccion-3d_poster_2400x1000.png" style="width:100%;display:block">
  <source src="altura-proteccion-3d_web_1200x500.webm" type="video/webm">
  <source src="altura-proteccion-3d_web_1200x500.mp4" type="video/mp4">
</video>
```

**Opción B (3D en vivo, nítido en cualquier pantalla):**

```html
<style>.aq3d{position:relative;width:100%;aspect-ratio:1200/500}.aq3d canvas,.aq3d svg{position:absolute;inset:0;width:100%;height:100%}</style>
<script type="importmap">{ "imports": { "three": "/ruta/vendor/three.module.min.js", "three/addons/": "/ruta/vendor/addons/" } }</script>
<div class="aq3d"></div>
<script type="module" src="/ruta/altura-proteccion-3d.js"></script>
```

La animación arranca cuando la sección entra en pantalla, se pausa fuera de ella y respeta "reducir movimiento" (muestra el cuadro final fijo).

## Volver a exportar

```bash
node render-frames.js <carpeta> 1200 500 30 2
ffmpeg -framerate 30 -i <carpeta>/%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p salida.mp4
```

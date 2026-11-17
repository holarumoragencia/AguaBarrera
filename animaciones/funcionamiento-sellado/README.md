# Animación 3D · Funcionamiento del sellado (modo de uso)

Sección de la web: **"Funcionamiento innovador y seguridad certificada"**.

Es un storyboard de uso en 16:9. A la izquierda, una maqueta 3D en corte: el exterior inundado a la izquierda, la puerta en el centro y el interior seco a la derecha. A la derecha, un panel que narra cada paso a medida que ocurre. Loop de 16 s.

| # | Paso | Qué se ve |
|---|---|---|
| 1 | **Funciona como una puerta convencional** | Aparece el aviso del mando a distancia y la puerta basculante baja y cierra |
| 2 | **Al cerrarse, el sello hace contacto** | Primer plano del sello perimetral apoyando en el umbral; el sello se ilumina |
| 3 | **El agua presiona desde fuera** | El agua sube a 1,20 m y aparecen flechas de presión |
| 4 | **El sello se comprime** | Primer plano del corte: el sello tubular se aplasta contra el labio del umbral |
| 5 | **El interior queda seco** | Plano general con "Interior seco · 0,00 L" (ensayo FM Global) |

Al final el agua baja, la puerta se abre y la animación vuelve a empezar.
El panel también muestra el estado en vivo: puerta (abierta, cerrando, cerrada), nivel del agua exterior y filtración al interior (0,00 L).

## Archivos

| Archivo | Para qué |
|---|---|
| `funcionamiento-sellado.html` | Página suelta con la animación en vivo |
| `funcionamiento-sellado.js` + `vendor/` | Código de la escena (Three.js 0.169) |
| `export/funcionamiento-sellado_1920x1080.mp4` | Video para compartir o presentar |
| `export/funcionamiento-sellado_web_1280x720.mp4` / `.webm` | Video liviano para la web |
| `export/funcionamiento-sellado_960x540.gif` | GIF |
| `export/funcionamiento-sellado_poster_1920x1080.png` | Imagen fija |
| `cuadros-de-estilo/` | Un cuadro por paso |
| `../preview-web-AguaBarrera.html` | El wireframe con las dos animaciones integradas |

## En la web

Como la animación ya narra los pasos, conviene mostrarla **a ancho completo** con el texto actual debajo, como en `preview-web-AguaBarrera.html`.

**Video:**

```html
<video autoplay muted loop playsinline poster="funcionamiento-sellado_poster_1920x1080.png" style="width:100%;display:block">
  <source src="funcionamiento-sellado_web_1280x720.webm" type="video/webm">
  <source src="funcionamiento-sellado_web_1280x720.mp4" type="video/mp4">
</video>
```

**3D en vivo:**

```html
<style>.aqseal{position:relative;width:100%;aspect-ratio:16/9}.aqseal canvas,.aqseal svg{position:absolute;inset:0;width:100%;height:100%}</style>
<script type="importmap">{ "imports": { "three": "/ruta/vendor/three.module.min.js", "three/addons/": "/ruta/vendor/addons/" } }</script>
<div class="aqseal"></div>
<script type="module" src="/ruta/funcionamiento-sellado.js"></script>
```

## Volver a exportar

```bash
DUR=16 node render-frames.js <carpeta> 1200 675 30 1.6
ffmpeg -framerate 30 -i <carpeta>/%04d.png -c:v libx264 -crf 17 -pix_fmt yuv420p salida.mp4
```

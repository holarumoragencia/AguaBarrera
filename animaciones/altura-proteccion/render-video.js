// Exporta frames PNG de la animación.  Uso: node render-video.js <outDir> <width> <height> <fps> [scale]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, w, h, fps, scale] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(scale || 1) });
  await p.goto('file://' + path.resolve(__dirname, 'altura-proteccion.html'));
  await p.waitForFunction(() => window.__aq);
  await p.evaluate(() => window.__aq.pause());
  const dur = await p.evaluate(() => window.__aq.DUR);
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.__aq.render(t), i / fps);
    await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.png` });
  }
  await b.close();
})();

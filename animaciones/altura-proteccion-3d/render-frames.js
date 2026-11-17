// Uso: node render-frames.js <outDir> <width> <height> <fps> <scale> [t1 t2 ...]
// Sin tiempos: exporta toda la animación (DUR*fps cuadros). Con tiempos: solo esos cuadros.
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
(async () => {
  const [out, w, h, fps, scale, ...times] = process.argv.slice(2);
  const extra = process.env.Q ? '&' + process.env.Q : '';
  const dir = __dirname;
  const srv = http.createServer((q, r) => {
    const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    const ext = path.extname(f);
    const type = { '.html': 'text/html', '.js': 'text/javascript' }[ext] || 'application/octet-stream';
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': type }); r.end(d); } });
  }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
  p.on('console', m => console.log('[page]', m.text()));
  p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto(`http://localhost:${port}/altura-proteccion-3d.html?capture${extra}`);
  await p.waitForFunction(() => window.__aq, null, { timeout: 60000 });
  const list = times.length ? times.map(Number) : [...Array(Math.round(10 * fps)).keys()].map(i => i / fps);
  for (let i = 0; i < list.length; i++) {
    await p.evaluate(t => window.__aq.render(t), list[i]);
    await p.screenshot({ path: times.length ? `${out}/t_${list[i]}.png` : `${out}/${String(i).padStart(4, '0')}.png` });
  }
  await b.close(); srv.close();
})();

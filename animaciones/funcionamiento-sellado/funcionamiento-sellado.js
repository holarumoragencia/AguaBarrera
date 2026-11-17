/*!
 * AquaLOCK® · "Funcionamiento innovador y seguridad certificada" — modo de uso del sellado
 * Escena 3D en corte (Three.js) + panel narrativo SVG que acompaña cada paso.
 * API: window.__aq = { render(t), play(), pause(), DUR }
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const C = {
  ink: '#313134', text: '#363636', grey: '#797D8E', hair: '#e3e5ec', line: '#eceef2',
  blue: '#728AFB', blueDark: '#4a5fd0', blueSoft: '#F1F3FF', orange: '#FF914D'
};
const FONT = '"Archivo", Roboto, Arial, sans-serif';
const DUR = 16;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const es = x => (1 - Math.cos(Math.PI * x)) / 2;
const lerp = (a, b, k) => a + (b - a) * k;
const fmt = v => v.toFixed(2).replace('.', ',');

/* ---------------- guion ---------------- */
const STEPS = [
  { t0: .3, t1: 3.6, kicker: 'Uso diario', title: 'Funciona como una puerta convencional',
    desc: 'Se abre y se cierra con mando a distancia: es una medida de seguridad antirrobo.' },
  { t0: 3.6, t1: 5.8, kicker: 'Cierre', title: 'Al cerrarse, el sello hace contacto',
    desc: 'El sello perimetral apoya en el umbral y en el marco. No hay que activar nada.' },
  { t0: 5.8, t1: 8.6, kicker: 'Inundación', title: 'El agua presiona desde fuera',
    desc: 'Miles de litros pueden acumularse en minutos frente al garaje.' },
  { t0: 8.6, t1: 11.6, kicker: 'Sellado', title: 'El sello se comprime',
    desc: 'La presión del agua lo ajusta aún más contra el umbral y el marco, en todo el perímetro.' },
  { t0: 11.6, t1: 14.8, kicker: 'Resultado', title: 'El interior queda seco',
    desc: '0,00 litros de filtración en el ensayo FM Global.' }
];

export function create(host, opts = {}) {
  const W = 1200, H = 675, SCN = 760;            // diseño: escena 760 px + panel 440 px
  const qs = new URLSearchParams(location.search);
  const v3 = new THREE.Vector3();

  /* ---------------- renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!opts.capture });
  renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  /* ---------------- texturas ---------------- */
  function speckle(base, n, seed) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const x = cv.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 512, 512);
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const r = rnd() < .08 ? 3 + rnd() * 6 : .8 + rnd() * 1.6;
      x.fillStyle = rnd() < .5 ? 'rgba(90,95,110,' + (.25 + rnd() * .3) + ')' : 'rgba(255,255,255,' + (.35 + rnd() * .4) + ')';
      x.beginPath(); x.ellipse(rnd() * 512, rnd() * 512, r, r * (.6 + rnd() * .4), rnd() * 3, 0, 7); x.fill();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const concTex = speckle('#c9ccd5', 2600, 7); concTex.repeat.set(15, .7);
  const coreTex = speckle('#ece8dc', 900, 3); coreTex.repeat.set(.12, 6);

  /* ---------------- materiales ---------------- */
  const M = {
    white: new THREE.MeshStandardMaterial({ color: '#f6f7f9', roughness: .9 }),
    wall: new THREE.MeshStandardMaterial({ color: '#f3f4f7', roughness: .92 }),
    inside: new THREE.MeshStandardMaterial({ color: '#f7f8fa', roughness: .95 }),
    outside: new THREE.MeshStandardMaterial({ color: '#e8eaef', roughness: .95 }),
    cut: new THREE.MeshStandardMaterial({ color: '#ffffff', map: concTex, roughness: .95 }),
    wallCut: new THREE.MeshStandardMaterial({ color: '#d4d7df', roughness: .95 }),
    door: new THREE.MeshStandardMaterial({ color: '#313134', roughness: .45, metalness: .3 }),
    doorRib: new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: .4, metalness: .3 }),
    core: new THREE.MeshStandardMaterial({ color: '#ffffff', map: coreTex, roughness: .95 }),
    holder: new THREE.MeshStandardMaterial({ color: '#232428', roughness: .5, metalness: .4 }),
    frame: new THREE.MeshStandardMaterial({ color: '#4a4c53', roughness: .3, metalness: .6 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9ccd4', roughness: .25, metalness: .85 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#3b4fc4', roughness: .55, metalness: 0, emissive: new THREE.Color('#728AFB'), emissiveIntensity: 0 }),
    carGlass: new THREE.MeshStandardMaterial({ color: '#9fa9bb', roughness: .15, metalness: .45 }),
    tire: new THREE.MeshStandardMaterial({ color: '#55575f', roughness: .8 }),
    water: new THREE.MeshStandardMaterial({ color: '#7d93fb', roughness: .2, transparent: true, opacity: .32, depthWrite: false }),
    waterCut: new THREE.MeshStandardMaterial({ color: '#8ea1fb', roughness: .3, transparent: true, opacity: .34, depthWrite: false }),
    waterTop: new THREE.MeshStandardMaterial({ color: '#728AFB', roughness: .06, metalness: .1, transparent: true, opacity: .16, depthWrite: false }),
    edge: new THREE.LineBasicMaterial({ color: '#8a8ea0', transparent: true, opacity: .45 }),
    waterEdge: new THREE.LineBasicMaterial({ color: '#4a5fd0', transparent: true, opacity: .85 })
  };

  const root = new THREE.Group(); scene.add(root);
  const shadow = (o, c = true, r = true) => { o.traverse(m => { if (m.isMesh) { m.castShadow = c; m.receiveShadow = r; } }); return o; };
  const edges = (m, a = 30) => { m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, a), M.edge)); return m; };
  // caja por límites; mat puede ser array (+x,-x,+y,-y,+z,-z)
  function box(x0, x1, y0, y1, z0, z1, mat = M.wall, parent = root, e = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (e) edges(m); parent.add(shadow(m)); return m;
  }
  const cutX = (cutMat, other = M.wall) => [cutMat, other, other, other, other, other];
  const cutXTop = (cutMat, top, other = M.wall) => [cutMat, other, top, other, other, other];

  /* ---------------- geometría (m). Corte de sección en x = 0 ---------------- */
  const X0 = -3.6, DX0 = -2.0;             // borde izq. del bloque, cara de la jamba
  const OUT = 4.4, IN = -6.2;              // exterior (z+) / interior (z-)
  // losa: exterior (vereda) e interior (piso del garaje)
  box(X0, 0, -.5, -.003, IN, OUT, cutXTop(M.cut, M.outside));
  box(X0, 0, -.003, 0, IN, 0, cutX(M.wallCut, M.inside), root, false);
  // pilar y dintel (muro)
  box(X0, DX0, 0, 3.0, -.28, 0, M.wall);
  box(DX0, 0, 2.32, 3.0, -.28, 0, cutX(M.wallCut));
  // marco de aluminio (jamba y dintel)
  box(DX0, DX0 + .06, .01, 2.32, -.2, -.02, cutX(M.frame, M.frame), root, false);
  box(DX0 + .06, 0, 2.26, 2.32, -.2, -.02, cutX(M.frame, M.frame), root, false);
  // juntas laterales y superior (se iluminan)
  const sideSeal = box(DX0 + .06, DX0 + .078, .04, 2.26, -.15, -.12, M.rubber, root, false);
  const topSeal = box(DX0 + .078, 0, 2.242, 2.26, -.15, -.12, cutX(M.rubber, M.rubber), root, false);
  // umbral: placa base + labio interior
  box(DX0 - .1, 0, .001, .009, -.22, .06, cutX(M.metal, M.metal), root, true);
  box(DX0 - .1, 0, .009, .036, -.16, -.12, cutX(M.metal, M.metal), root, true);

  /* ---------------- puerta basculante (grupo con pivote) ---------------- */
  const PIV = { y: 1.5, z: -.115 };
  const doorG = new THREE.Group(); root.add(doorG);
  const dx0 = DX0 + .085, dx1 = 0;
  const yb = .078, yt = 2.235;                         // base / tope de la hoja
  const rel = (y, z) => [y - PIV.y, z - PIV.z];
  function dbox(x0, x1, y0, y1, z0, z1, mat, e = true) {
    const [a0, b0] = rel(y0, z0), [a1, b1] = rel(y1, z1);
    return box(x0, x1, a0, a1, b0, b1, mat, doorG, e);
  }
  dbox(dx0, dx1, yb, yt, -.095, -.09, cutX(M.door, M.door));          // chapa exterior
  dbox(dx0, dx1, yb, yt, -.135, -.095, cutX(M.core, M.door), false);  // núcleo aislante
  dbox(dx0, dx1, yb, yt, -.14, -.135, cutX(M.door, M.door));          // chapa interior
  for (let i = 1; i < 6; i++) { const y = yb + (yt - yb) * i / 6; dbox(dx0 + .04, dx1, y - .01, y + .01, -.09, -.084, cutX(M.doorRib, M.doorRib), false); }
  dbox(dx0, dx1, yb - .016, yb, -.128, -.05, cutX(M.holder, M.holder), false);   // perfil porta-sello
  // sello inferior: perfil tubular hueco, extruido a lo largo de x
  const R = .032;
  const ring = new THREE.Shape(); ring.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, R * .58, 0, Math.PI * 2, true); ring.holes.push(hole);
  const sealGeo = new THREE.ExtrudeGeometry(ring, { depth: dx1 - dx0 + .0015, bevelEnabled: false, curveSegments: 48 });
  sealGeo.rotateY(Math.PI / 2);                         // extrusión a lo largo de +x
  const sealAnchor = new THREE.Group();                 // apoyo contra el labio del umbral
  { const [a, b] = rel(.008, -.12); sealAnchor.position.set(dx0, a, b); }
  doorG.add(sealAnchor);
  const sealMesh = new THREE.Mesh(sealGeo, M.rubber);
  sealMesh.position.set(0, R, R);                       // centro del tubo, a R del apoyo
  sealAnchor.add(shadow(sealMesh, false, true));

  function setDoor(theta) {                             // 0 = cerrada, 1 = abierta (90°)
    const a = theta * Math.PI / 2;
    doorG.position.set(0, PIV.y + .72 * Math.sin(a), PIV.z);
    doorG.rotation.x = -a;
  }

  /* ---------------- coche (interior) ---------------- */
  function car() {
    const g = new THREE.Group(), color = M.white, Wd = 1.78;
    const body = new THREE.Shape();
    body.moveTo(-2.1, .30); body.lineTo(2.0, .30);
    body.quadraticCurveTo(2.12, .32, 2.12, .55); body.quadraticCurveTo(2.12, .86, 1.8, .9);
    body.lineTo(-1.6, .96); body.quadraticCurveTo(-2.1, .95, -2.12, .62); body.quadraticCurveTo(-2.12, .32, -2.1, .30);
    const bev = .14;
    const bg = new THREE.ExtrudeGeometry(body, { depth: Wd - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 20 });
    bg.translate(0, 0, -(Wd - 2 * bev) / 2); g.add(new THREE.Mesh(bg, color));
    const cab = new THREE.Shape();
    cab.moveTo(-1.35, .9); cab.lineTo(1.25, .9); cab.quadraticCurveTo(.95, 1.36, .55, 1.4); cab.lineTo(-.85, 1.4); cab.quadraticCurveTo(-1.2, 1.38, -1.35, .9);
    const cb = .1, cw = 1.48;
    const cg = new THREE.ExtrudeGeometry(cab, { depth: cw - 2 * cb, bevelEnabled: true, bevelThickness: cb, bevelSize: cb, bevelSegments: 4, curveSegments: 16 });
    cg.translate(0, 0, -(cw - 2 * cb) / 2); g.add(new THREE.Mesh(cg, M.carGlass));
    const roof = new THREE.Mesh(new RoundedBoxGeometry(1.45, .08, cw - .02, 3, .035), color); roof.position.set(-.15, 1.44, 0); g.add(roof);
    [[1.35, .82], [1.35, -.82], [-1.35, .82], [-1.35, -.82]].forEach(([x, z]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .24, 32), M.tire); w.rotation.x = Math.PI / 2; w.position.set(x, .33, z); g.add(w);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .245, 24), M.white); hub.rotation.x = Math.PI / 2; hub.position.set(x, .33, z); g.add(hub);
    });
    return shadow(g);
  }
  const carIn = car(); carIn.rotation.y = Math.PI / 2; carIn.position.set(-1.3, 0, -3.5); root.add(carIn);

  /* ---------------- agua exterior ---------------- */
  const WA = { x0: X0 + .02, x1: -.002, z0: -.05, z1: OUT - .02 };
  const wGeo = new THREE.BoxGeometry(1, 1, 1); wGeo.translate(.5, .5, .5);
  const wMats = [M.waterCut, M.water, M.water, M.water, M.water, M.water];
  const water = new THREE.Mesh(wGeo, wMats); water.renderOrder = 2;
  water.position.set(WA.x0, 0, WA.z0);
  water.add(new THREE.LineSegments(new THREE.EdgesGeometry(wGeo), M.waterEdge));
  root.add(water);
  const nCan = document.createElement('canvas'); nCan.width = nCan.height = 256;
  { const x = nCan.getContext('2d'), img = x.createImageData(256, 256), a = Math.PI * 2 / 256;
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const dx = .5 * Math.cos(i * a * 3 + Math.sin(j * a * 2) * 1.5) + .3 * Math.cos((i + j) * a * 5);
      const dy = .5 * Math.cos(j * a * 4 + Math.sin(i * a * 2) * 1.2) + .3 * Math.sin((i - j) * a * 3);
      const k = (j * 256 + i) * 4; img.data[k] = 128 + dx * 60; img.data[k + 1] = 128 + dy * 60; img.data[k + 2] = 255; img.data[k + 3] = 255;
    } x.putImageData(img, 0, 0); }
  const nTex = new THREE.CanvasTexture(nCan); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping; nTex.repeat.set(2, 2);
  M.waterTop.normalMap = nTex; M.waterTop.normalScale.set(.35, .35);
  const wTop = new THREE.Mesh(new THREE.PlaneGeometry(WA.x1 - WA.x0, WA.z1 - WA.z0), M.waterTop);
  wTop.rotation.x = -Math.PI / 2; wTop.position.set((WA.x0 + WA.x1) / 2, 0, (WA.z0 + WA.z1) / 2); wTop.renderOrder = 3;
  root.add(wTop);

  /* ---------------- luces ---------------- */
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9dce6', .75));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(12, 16, 9); sun.target.position.set(-1.5, 0, -1);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 5; sun.shadow.bias = -.0003; sun.shadow.normalBias = .01;
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 50 });
  scene.add(sun, sun.target);

  /* ---------------- cámara ---------------- */
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 30, 90);
  const K = {
    wide: { t: [-1.6, 1.15, -1.0], w: 9.6 },
    seal: { t: [-.15, .22, -.1], w: 1.7 },
    water: { t: [-1.05, .9, .55], w: 8.2 },
    macro: { t: [-.03, .07, -.08], w: .46 }
  };
  const KEYS = [   // [t, key] — se interpola entre claves con suavizado
    [0, 'wide'], [3.7, 'wide'], [4.7, 'seal'], [5.7, 'seal'], [6.7, 'water'], [8.7, 'water'],
    [9.7, 'macro'], [11.6, 'macro'], [12.7, 'wide'], [16, 'wide']
  ];
  const AZ = +(qs.get('az') || 72), EL = +(qs.get('el') || 17);
  let cw = W, ch = H;
  function setCamera(t) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const [ta, ka] = KEYS[i], [tb, kb] = KEYS[i + 1];
    const k = eio(seg(t, ta, tb)), A = K[ka], B = K[kb];
    // el ancho se interpola en escala logarítmica (zoom natural)
    const w = Math.exp(lerp(Math.log(A.w), Math.log(B.w), k));
    const tg = new THREE.Vector3(lerp(A.t[0], B.t[0], k), lerp(A.t[1], B.t[1], k), lerp(A.t[2], B.t[2], k));
    const az = (AZ + 2 * Math.sin(2 * Math.PI * t / DUR)) * Math.PI / 180, el = EL * Math.PI / 180, Rr = 60;
    cam.position.set(tg.x + Rr * Math.sin(az) * Math.cos(el), tg.y + Rr * Math.sin(el), tg.z + Rr * Math.cos(az) * Math.cos(el));
    cam.lookAt(tg);
    // el objetivo se ubica en el centro del área de escena (izquierda del lienzo)
    const sw = SCN / W * cw;                          // ancho de la escena en px reales
    const u = w / sw;                                 // m por px
    cam.left = -sw / 2 * u; cam.right = sw / 2 * u; cam.top = ch / 2 * u; cam.bottom = -ch / 2 * u;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }

  /* ---------------- capa SVG ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); host.appendChild(svg);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
  const mk = (tag, a, p = svg) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const txt = (p, x, y, s, size, o = {}) => { const e = mk('text', Object.assign({ x, y, 'font-family': FONT, 'font-size': size, fill: C.ink }, o), p); e.textContent = s; return e; };
  const pr = (x, y, z) => { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2 * SCN, (1 - v3.y) / 2 * H]; };   // a coords de diseño

  const fdefs = mk('defs', {});
  const fg = mk('linearGradient', { id: 'aqfade', x1: 0, y1: 0, x2: 1, y2: 0 }, fdefs);
  mk('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, fg); mk('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 1 }, fg);
  mk('rect', { x: SCN - 70, y: 0, width: 71, height: H, fill: 'url(#aqfade)' });
  // flechas de presión
  const gArr = mk('g', {});
  const arrows = [];
  for (let i = 0; i < 9; i++) arrows.push(mk('path', { fill: 'none', stroke: C.blueDark, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gArr));

  // insignias numeradas en la escena (mismo estilo que la web)
  const badges = STEPS.map((s, i) => {
    const g = mk('g', { opacity: 0 });
    mk('circle', { r: 15, fill: C.ink, stroke: '#fff', 'stroke-width': 3 }, g);
    txt(g, 0, 5, String(i + 1), 14, { 'text-anchor': 'middle', fill: '#fff', 'font-weight': 700 });
    return g;
  });
  const BADGE_AT = [
    () => { const p = new THREE.Vector3(-1.0, 1.55 - PIV.y, -.09 - PIV.z); return doorG.localToWorld(p); },
    () => new THREE.Vector3(0, .16, -.09),
    () => new THREE.Vector3(0, Math.max(.15, wl * .55), 1.7),
    () => new THREE.Vector3(0, .12, -.03),
    () => new THREE.Vector3(0, .25, -.75)
  ];
  let wl = 0;

  // rótulos técnicos
  const labels = [];
  function label(text, at, dx, dy, win) {
    const g = mk('g', { opacity: 0 });
    const ln = mk('path', { stroke: C.grey, 'stroke-width': 1, fill: 'none' }, g);
    const dot = mk('circle', { r: 2.6, fill: '#fff', stroke: C.grey, 'stroke-width': 1.2 }, g);
    const bx = mk('rect', { rx: 5, fill: '#fff', stroke: C.hair, height: 26 }, g);
    const t = txt(g, 0, 0, text, 12.5, { 'font-weight': 600 });
    const o = { g, ln, dot, bx, t, at, dx, dy, win, w: 0 }; labels.push(o); return o;
  }
  label('Sello perimetral', () => new THREE.Vector3(0, .04, -.088), 80, -80, [4.6, 5.8]);
  label('Umbral', () => new THREE.Vector3(0, .02, -.17), 70, 50, [4.75, 5.8]);
  label('Sello comprimido', () => new THREE.Vector3(0, .04, -.095), 110, -40, [9.8, 11.6]);
  label('Labio del umbral', () => new THREE.Vector3(0, .028, -.14), 90, 80, [9.95, 11.6]);
  label('Panel de acero aislado', () => new THREE.Vector3(0, .16, -.115), 90, -90, [10.1, 11.6]);
  label('Presión del agua', () => new THREE.Vector3(0, .1, .12), 30, -170, [9.9, 11.6]);
  label('Interior seco · 0,00 L', () => new THREE.Vector3(0, .01, -.75), 50, 70, [12.6, 14.6]);
  label('Agua exterior', () => new THREE.Vector3(0, .5, 2.2), -60, -90, [6.6, 8.6]);

  // chip "mando a distancia"
  const remote = mk('g', { opacity: 0 });
  mk('rect', { x: 28, y: 28, width: 214, height: 46, rx: 23, fill: '#fff', stroke: C.hair }, remote);
  const rIcon = mk('g', { transform: 'translate(52 51)' }, remote);
  mk('rect', { x: -8, y: -13, width: 16, height: 26, rx: 5, fill: C.ink }, rIcon);
  const rBtn = mk('circle', { cx: 0, cy: -4, r: 3.2, fill: C.blue }, rIcon);
  const waves = [0, 1, 2].map(i => mk('path', { d: `M${-6 - i * 4} ${-17 - i * 4}a${8 + i * 5} ${8 + i * 5} 0 0 1 ${12 + i * 8} 0`, fill: 'none', stroke: C.blue, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, rIcon));
  txt(remote, 72, 47, 'Mando a distancia', 12.5, { 'font-weight': 600 });
  const rState = txt(remote, 72, 63, 'Cerrar', 11.5, { fill: C.grey });

  /* ---------------- panel narrativo (derecha) ---------------- */
  const PX = 806, PW = 360;
  const panel = mk('g', {});
  mk('line', { x1: SCN + 14, y1: 40, x2: SCN + 14, y2: H - 40, stroke: C.line, 'stroke-width': 1 }, panel);
  txt(panel, PX, 70, 'MODO DE USO', 11, { 'font-weight': 600, 'letter-spacing': 1.8, fill: C.grey });
  txt(panel, PX, 100, 'Cómo funciona el sellado', 22, { 'font-weight': 500, 'letter-spacing': -.2 });
  function wrap(s, n) { const out = []; let cur = ''; s.split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; }); if (cur.trim()) out.push(cur.trim()); return out; }
  const rail = mk('line', { x1: PX + 14, x2: PX + 14, stroke: C.hair, 'stroke-width': 2 }, panel);
  const railOn = mk('line', { x1: PX + 14, x2: PX + 14, stroke: C.ink, 'stroke-width': 2 }, panel);
  const items = STEPS.map((s, i) => {
    const g = mk('g', {}, panel);
    const ring = mk('circle', { cx: PX + 14, cy: 0, r: 14, fill: '#fff', stroke: C.hair, 'stroke-width': 2 }, g);
    const num = txt(g, PX + 14, 5, String(i + 1), 13, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.grey });
    const kick = txt(g, PX + 44, -6, s.kicker.toUpperCase(), 10, { 'font-weight': 600, 'letter-spacing': 1.4, fill: C.grey });
    const title = txt(g, PX + 44, 11, s.title, 15, { 'font-weight': 600 });
    const dg = mk('g', {}, g);
    const lines = wrap(s.desc, 44).map((l, j) => txt(dg, PX + 44, 34 + j * 19, l, 13, { fill: C.text }));
    const pbBg = mk('rect', { x: PX + 44, height: 2, rx: 1, width: PW - 50, fill: C.line }, dg);
    const pb = mk('rect', { x: PX + 44, height: 2, rx: 1, width: 0, fill: C.blue }, dg);
    return { g, ring, num, kick, title, dg, lines, pbBg, pb, n: lines.length };
  });
  // lecturas de estado
  const ro = mk('g', {}, panel);
  const RO_Y = 520;
  mk('rect', { x: PX, y: RO_Y, width: PW, height: 112, rx: 10, fill: '#fafbfc', stroke: C.hair }, ro);
  const roRows = [['Puerta', 'Abierta'], ['Nivel del agua exterior', '0,00 m'], ['Filtración al interior', '0,00 L']].map(([a, b], i) => {
    const y = RO_Y + 30 + i * 32;
    if (i) mk('line', { x1: PX + 16, x2: PX + PW - 16, y1: y - 18, y2: y - 18, stroke: C.line }, ro);
    txt(ro, PX + 16, y + 3, a, 12.5, { fill: C.grey });
    return txt(ro, PX + PW - 16, y + 3, b, 13.5, { 'text-anchor': 'end', 'font-weight': 600, 'font-variant-numeric': 'tabular-nums' });
  });

  function layout() {
    labels.forEach(l => { l.w = l.t.getComputedTextLength() + 20; });
  }
  function resize() {
    const r = host.getBoundingClientRect();
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    renderer.setSize(cw, ch, false);
  }

  /* ---------------- render ---------------- */
  const P = a => `${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    // ---- estado físico ----
    const close = eio(seg(t, 1.1, 3.3)), reopen = eio(seg(t, 15.0, 15.95));
    const theta = t < 15 ? 1 - close : reopen;
    setDoor(theta);
    wl = t < 14.7 ? 1.2 * es(seg(t, 6.0, 8.4)) : 1.2 * (1 - eio(seg(t, 14.7, 15.4)));
    const contact = eo(seg(t, 3.15, 3.4)) * (1 - seg(t, 15.0, 15.1));
    const press = eio(seg(t, 9.0, 10.5)) * (1 - eio(seg(t, 14.7, 15.3)));
    const sz = 1 - .12 * contact - .3 * press, sy = 1 + .03 * contact + .1 * press;
    sealAnchor.scale.set(1, sy, sz);
    const glow = Math.max(eo(seg(t, 3.3, 3.7)) * (1 - eio(seg(t, 4.6, 5.8))), .9 * eo(seg(t, 9.6, 10.3)) * (1 - eio(seg(t, 11.4, 12.2))));
    M.rubber.emissiveIntensity = (t > 9 && t < 12.5 ? .4 : .9) * glow;
    water.visible = wTop.visible = wl > .004;
    water.scale.set(WA.x1 - WA.x0, Math.max(wl, .001), WA.z1 - WA.z0);
    wTop.position.y = wl + .001;
    nTex.offset.set(t * .03, t * .02);
    setCamera(t);
    const sw = Math.round(SCN / W * cw);
    renderer.setScissorTest(false); renderer.setClearColor('#ffffff', 1); renderer.setViewport(0, 0, cw, ch); renderer.clear();
    renderer.setViewport(0, 0, sw, ch); renderer.setScissor(0, 0, sw, ch); renderer.setScissorTest(true);
    renderer.render(scene, cam);
    renderer.setScissorTest(false);

    // ---- flechas de presión ----
    const arrOn = eo(seg(t, 6.4, 7.0)) * (1 - eo(seg(t, 11.5, 12.0)));
    gArr.setAttribute('opacity', arrOn.toFixed(3));
    arrows.forEach((a, i) => {
      if (arrOn <= 0 || wl < .05) { a.setAttribute('d', ''); return; }
      const row = i % 3, col = Math.floor(i / 3);
      const y = [.2, .5, .8][row] * wl;
      const yy = t > 9.0 && t < 12 ? [.02, .045, .07][row] : y;
      const phase = ((t * .45 + col / 3) % 1);
      const zA = (t > 9 && t < 12 ? .26 : 1.6) * (1 - phase) + (t > 9 && t < 12 ? .045 : .25) * phase;
      const len = t > 9 && t < 12 ? .045 : .38;
      const A = pr(.01, yy, zA + len), B = pr(.01, yy, zA);
      const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), hs = 7;
      const h1 = [B[0] - hs * Math.cos(ang - .5), B[1] - hs * Math.sin(ang - .5)], h2 = [B[0] - hs * Math.cos(ang + .5), B[1] - hs * Math.sin(ang + .5)];
      a.setAttribute('d', `M${P(A)}L${P(B)}M${P(h1)}L${P(B)}L${P(h2)}`);
      a.setAttribute('opacity', (Math.sin(Math.PI * phase)).toFixed(3));
    });

    // ---- paso activo ----
    let act = -1; STEPS.forEach((s, i) => { if (t >= s.t0) act = i; });
    if (t >= 14.8) act = -2;   // reinicio
    const reset = seg(t, 14.8, 15.4);

    badges.forEach((b, i) => {
      const s = STEPS[i];
      const vis = eo(seg(t, s.t0 + .2, s.t0 + .6)) * (1 - eo(seg(t, s.t1 - .3, s.t1)));
      const p = BADGE_AT[i](), q = pr(p.x, p.y, p.z);
      b.setAttribute('opacity', vis.toFixed(3));
      b.setAttribute('transform', `translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) scale(${(.8 + .2 * vis).toFixed(3)})`);
    });
    labels.forEach(l => {
      const vis = eo(seg(t, l.win[0], l.win[0] + .4)) * (1 - eo(seg(t, l.win[1] - .3, l.win[1])));
      l.g.setAttribute('opacity', vis.toFixed(3));
      if (vis <= 0) return;
      const p = l.at(), A = pr(p.x, p.y, p.z), L = [A[0] + l.dx, A[1] + l.dy];
      l.ln.setAttribute('d', `M${P(A)}L${P(L)}`);
      l.dot.setAttribute('cx', A[0]); l.dot.setAttribute('cy', A[1]);
      const x = l.dx >= 0 ? L[0] : L[0] - l.w, y = L[1] - 13;
      l.bx.setAttribute('x', x); l.bx.setAttribute('y', y); l.bx.setAttribute('width', l.w);
      l.t.setAttribute('x', x + 10); l.t.setAttribute('y', y + 17.5);
    });

    // chip del mando
    const rv = eo(seg(t, .3, .7)) * (1 - eo(seg(t, 3.3, 3.8))) + eo(seg(t, 14.9, 15.2)) * (1 - eo(seg(t, 15.8, 16)));
    remote.setAttribute('opacity', cl(rv).toFixed(3));
    const pulse = t < 5 ? seg(t, .7, 1.5) : seg(t, 15.0, 15.8);
    waves.forEach((w, i) => w.setAttribute('opacity', (pulse > 0 && pulse < 1 ? Math.max(0, Math.sin(Math.PI * cl(pulse * 2 - i * .25))) : 0).toFixed(3)));
    rBtn.setAttribute('fill', pulse > 0 && pulse < 1 ? C.orange : C.blue);
    rState.textContent = t < 5 ? (t < 3.3 ? 'Cerrar puerta' : 'Puerta cerrada') : 'Abrir puerta';

    // panel: posiciones con el paso activo expandido
    let y = 150;
    const yc = [];
    items.forEach((it, i) => {
      const s = STEPS[i];
      const isAct = i === act, done = act === -2 ? false : i < act;
      const ex = eo(seg(t, s.t0, s.t0 + .45)) * (1 - eo(seg(t, s.t1, s.t1 + .45)));
      const exH = (it.n * 19 + 28) * ex;
      it.g.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
      yc.push(y);
      it.dg.setAttribute('opacity', ex.toFixed(3));
      it.pbBg.setAttribute('y', 34 + (it.n - 1) * 19 + 15); it.pb.setAttribute('y', 34 + (it.n - 1) * 19 + 15);
      it.pb.setAttribute('width', ((PW - 50) * seg(t, s.t0, s.t1)).toFixed(1));
      const on = isAct ? 1 : done ? .85 : 0;
      it.ring.setAttribute('fill', isAct || done ? C.ink : '#fff');
      it.ring.setAttribute('stroke', isAct || done ? C.ink : C.hair);
      it.num.setAttribute('fill', isAct || done ? '#fff' : C.grey);
      it.title.setAttribute('fill', isAct ? C.ink : done ? '#55565c' : '#a3a6b2');
      it.kick.setAttribute('fill', isAct ? C.blueDark : '#a3a6b2');
      y += 54 + exH;
    });
    rail.setAttribute('y1', yc[0]); rail.setAttribute('y2', yc[yc.length - 1]);
    const ai = act < 0 ? -1 : act;
    railOn.setAttribute('y1', yc[0]); railOn.setAttribute('y2', ai < 0 ? yc[0] : yc[ai]);
    railOn.setAttribute('opacity', ai < 0 ? 0 : 1);
    // lecturas
    roRows[0].textContent = t < 1.1 ? 'Abierta' : t < 3.3 ? 'Cerrando…' : t < 15 ? 'Cerrada' : 'Abriendo…';
    roRows[1].textContent = fmt(wl) + ' m';
    roRows[1].setAttribute('fill', wl > .01 ? C.blueDark : C.ink);
    roRows[2].setAttribute('fill', t > 11.6 && t < 14.8 ? C.blueDark : C.ink);
  }

  /* ---------------- reproducción ---------------- */
  let raf = 0, t0 = 0, tOff = 0, playing = false;
  const frame = now => { if (!playing) return; render((now - t0) / 1000 + tOff); raf = requestAnimationFrame(frame); };
  const play = () => { if (playing) return; playing = true; t0 = performance.now(); raf = requestAnimationFrame(frame); };
  const pause = () => { if (!playing) return; playing = false; cancelAnimationFrame(raf); tOff += (performance.now() - t0) / 1000; };
  resize(); layout();
  new ResizeObserver(() => { resize(); if (!playing) render(tOff); }).observe(host);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  render(reduce ? 13 : 0);
  if (opts.autoplay !== false && !reduce) {
    if ('IntersectionObserver' in window) new IntersectionObserver(es2 => es2.forEach(e => e.isIntersecting ? play() : pause()), { threshold: .2 }).observe(host);
    else play();
  }
  return { render, play, pause, DUR };
}

const boot = async () => {
  try { await Promise.all([document.fonts.load('600 13px Archivo'), document.fonts.load('500 22px Archivo'), document.fonts.load('400 12px Archivo')]); } catch (e) { }
  const capture = new URLSearchParams(location.search).has('capture');
  document.querySelectorAll('.aqseal').forEach((h, i) => {
    const inst = create(h, { capture, autoplay: !capture, pixelRatio: capture ? 1 : undefined });
    if (i === 0) window.__aq = inst;
  });
};
boot();

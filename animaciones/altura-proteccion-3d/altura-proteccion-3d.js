/*!
 * AquaLOCK® · "Altura de protección" — escena 3D (maqueta arquitectónica)
 * Three.js + capa SVG para cotas, rótulos y contador.
 * API: window.__aq = { render(t), play(), pause(), DUR }
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const C = {
  ink: '#313134', grey: '#797D8E', hair: '#eceef2', blue: '#728AFB', blueDark: '#4a5fd0',
  blueSoft: '#F1F3FF', orange: '#FF914D'
};
const FONT = '"Archivo", Roboto, Arial, sans-serif';
const DUR = 10, HMAX = 1.6;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const es = x => (1 - Math.cos(Math.PI * x)) / 2;
const fmt = v => v.toFixed(2).replace('.', ',');

export function create(host, opts = {}) {
  const W = 1200, H = 500;
  const scale = opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 2);

  /* ---------------- renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!opts.capture });
  renderer.setPixelRatio(scale);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  /* ---------------- materiales ---------------- */
  const M = {
    white: new THREE.MeshStandardMaterial({ color: '#f6f7f9', roughness: .9 }),
    wall: new THREE.MeshStandardMaterial({ color: '#f3f4f7', roughness: .92 }),
    base: new THREE.MeshStandardMaterial({ color: '#eceef2', roughness: .95 }),
    lot: new THREE.MeshStandardMaterial({ color: '#f7f8fa', roughness: .95 }),
    street: new THREE.MeshStandardMaterial({ color: '#e4e6eb', roughness: .95 }),
    cut: new THREE.MeshStandardMaterial({ color: '#aeb3c1', roughness: .95 }),
    glass: new THREE.MeshStandardMaterial({ color: '#b9c2d2', roughness: .12, metalness: .55, transparent: true, opacity: .8 }),
    carGlass: new THREE.MeshStandardMaterial({ color: '#9fa9bb', roughness: .15, metalness: .45 }),
    door: new THREE.MeshStandardMaterial({ color: '#313134', roughness: .45, metalness: .25 }),
    doorRib: new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: .4, metalness: .3 }),
    doorPanel: new THREE.MeshStandardMaterial({ color: '#3a3b40', roughness: .38, metalness: .3 }),
    frame: new THREE.MeshStandardMaterial({ color: '#4a4c53', roughness: .3, metalness: .6 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9ccd4', roughness: .25, metalness: .85 }),
    tire: new THREE.MeshStandardMaterial({ color: '#55575f', roughness: .8 }),
    tree: new THREE.MeshStandardMaterial({ color: '#eef0f3', roughness: .95 }),
    water: new THREE.MeshStandardMaterial({ color: '#7d93fb', roughness: .2, transparent: true, opacity: .25, depthWrite: false }),
    waterTop: new THREE.MeshStandardMaterial({ color: '#728AFB', roughness: .06, metalness: .1, transparent: true, opacity: .13, depthWrite: false }),
    seal: new THREE.MeshBasicMaterial({ color: '#728AFB', transparent: true, opacity: 0 }),
    edge: new THREE.LineBasicMaterial({ color: '#8a8ea0', transparent: true, opacity: .45 }),
    waterEdge: new THREE.LineBasicMaterial({ color: '#4a5fd0', transparent: true, opacity: .85 })
  };

  /* ---------------- helpers ---------------- */
  const root = new THREE.Group(); scene.add(root);
  function shadow(o, cast = true, recv = true) { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; }
  function edges(mesh, angle = 30, mat = M.edge) {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), mat);
    mesh.add(l); return mesh;
  }
  // caja por límites [x0,x1]x[y0,y1]x[z0,z1]; mats opcional (array por cara +x,-x,+y,-y,+z,-z)
  function box(x0, x1, y0, y1, z0, z1, mat = M.wall, parent = root, withEdges = true) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const m = new THREE.Mesh(g, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (withEdges) edges(m);
    parent.add(shadow(m)); return m;
  }
  function rbox(x0, x1, y0, y1, z0, z1, r, mat = M.wall, parent = root) {
    const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 4, r);
    const m = new THREE.Mesh(g, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    parent.add(shadow(m)); return m;
  }
  // planta con esquinas redondeadas por esquina: r = [x0z0, x1z0, x1z1, x0z1]
  function plan(x0, x1, z0, z1, r) {
    const s = new THREE.Shape();
    const R = Array.isArray(r) ? r : [r, r, r, r];
    // forma en (x, -z) para que al rotar -90° en X quede en el plano XZ
    const P = (x, z) => [x, -z];
    let p = P(x0 + R[0], z0); s.moveTo(p[0], p[1]);
    p = P(x1 - R[1], z0); s.lineTo(p[0], p[1]);
    if (R[1]) { const c = P(x1, z0), e = P(x1, z0 + R[1]); s.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    p = P(x1, z1 - R[2]); s.lineTo(p[0], p[1]);
    if (R[2]) { const c = P(x1, z1), e = P(x1 - R[2], z1); s.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    p = P(x0 + R[3], z1); s.lineTo(p[0], p[1]);
    if (R[3]) { const c = P(x0, z1), e = P(x0, z1 - R[3]); s.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    p = P(x0, z0 + R[0]); s.lineTo(p[0], p[1]);
    if (R[0]) { const c = P(x0, z0), e = P(x0 + R[0], z0); s.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    return s;
  }
  function slab(shape, y0, y1, mat = M.wall, bevel = .05, parent = root) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.001, y1 - y0 - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.y = y0 + bevel;
    edges(m, 35);
    parent.add(shadow(m)); return m;
  }

  /* ---------------- base / entorno ---------------- */
  const PL = { x0: -9.6, x1: 10.6, z0: -9.4, z1: 6.8 };
  slab(plan(PL.x0, PL.x1, PL.z0, PL.z1, .7), -.75, -.12, M.base, .06);
  slab(plan(PL.x0 + .2, PL.x1 - .2, PL.z0 + .2, 0, [.5, .5, 0, 0]), -.12, 0, M.lot, .0);
  box(PL.x0 + .2, PL.x1 - .2, -.12, 0, 0, 2.2, M.lot);                     // vereda
  // calle: líneas
  for (let x = -8.4; x < 9.6; x += 2.4) box(x, x + 1.2, -.119, -.115, 4.75, 4.85, M.white, root, false);
  // árboles maqueta (atrás)
  function tree(x, z, s = 1) {
    const g = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.07 * s, .09 * s, 2.2 * s, 12), M.tree); tr.position.y = 1.1 * s; g.add(tr);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(1.25 * s, 32, 20), M.tree); cr.position.y = 2.9 * s; cr.scale.y = 1.1; g.add(cr);
    g.position.set(x, 0, z); root.add(shadow(g)); return g;
  }
  tree(-8.6, -8.4, .9); tree(-6.4, -8.9, .7);

  /* ---------------- casa ---------------- */
  const G = { x0: 2.6, x1: 8.4, z0: -6.6, z1: 0, h: 2.9, t: .25 };
  const DR = { x0: 3.5, x1: 7.5, h: 2.25 };
  // planta baja (volumen macizo hacia la calle, esquina redondeada)
  slab(plan(-8.2, G.x0, -8.2, 0, [1.4, 0, 0, 1.6]), 0, 3.0, M.wall, .04);
  // ventana alta corrida
  box(-6.9, 1.7, 2.1, 2.65, -.02, .02, M.glass, root, true);
  // cubierta en voladizo, esquinas redondeadas
  slab(plan(-8.9, 3.2, -8.9, .75, [2.0, 1.0, 2.0, 2.3]), 3.0, 3.32, M.white, .06);
  // volumen superior retirado (estudio vidriado)
  slab(plan(-6.8, -1.2, -7.4, -2.6, [1.4, 1.4, 1.4, 1.4]), 3.32, 5.5, M.glass, 0);
  for (let x = -5.6; x <= -2.4; x += 1.1) box(x, x + .07, 3.32, 5.5, -2.62, -2.55, M.white, root, false);
  slab(plan(-7.3, -.7, -7.9, -2.1, [1.8, 1.8, 1.8, 1.8]), 5.5, 5.8, M.white, .06);
  /* ---------------- garaje en corte ---------------- */
  const cutMats = [M.cut, M.wall, M.cut, M.wall, M.wall, M.wall];
  box(G.x0, G.x1, 0, G.h, G.z0, G.z0 + G.t, cutMats);                         // muro fondo
  box(G.x0, DR.x0, 0, G.h, G.z1 - G.t, G.z1, cutMats);                              // pilar izq.
  box(DR.x1, G.x1, 0, G.h, G.z1 - G.t, G.z1, cutMats);                    // pilar der. (cortado)
  box(DR.x0, DR.x1, DR.h, G.h, G.z1 - G.t, G.z1, cutMats);                          // dintel
  box(G.x0 + .02, G.x1, -.01, .015, G.z0 + G.t, G.z1 - G.t, M.white, root, false); // piso interior
  // pretil terraza
  // puerta AquaLOCK: marco, hoja con paneles redondeados, tirador, umbral y placa
  const zd = G.z1 - .14;
  const fw = .09;   // marco de aluminio
  [[DR.x0 - fw, DR.x0, 0, DR.h + fw], [DR.x1, DR.x1 + fw, 0, DR.h + fw], [DR.x0, DR.x1, DR.h, DR.h + fw]].forEach(b =>
    rbox(b[0], b[1], b[2], b[3], G.z1 - .2, G.z1 + .035, .015, M.frame));
  box(DR.x0, DR.x1, 0, DR.h, zd - .05, zd, M.door, root, false);
  const np = 5, gap = .035, ph = (DR.h - .08 - gap * (np - 1)) / np;
  for (let i = 0; i < np; i++) {
    const y0 = .04 + i * (ph + gap);
    rbox(DR.x0 + .07, DR.x1 - .07, y0, y0 + ph, zd - .01, zd + .035, .018, M.doorPanel);
    rbox(DR.x0 + .07, DR.x1 - .07, y0 + ph * .5 - .006, y0 + ph * .5 + .006, zd + .03, zd + .04, .004, M.doorRib);
  }
  rbox((DR.x0 + DR.x1) / 2 - .22, (DR.x0 + DR.x1) / 2 + .22, .95, 1.0, zd + .035, zd + .085, .02, M.metal);
  rbox(DR.x0 - .12, DR.x1 + .12, 0, .035, G.z1 - .2, G.z1 + .14, .012, M.metal);          // umbral
  {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const x = cv.getContext('2d'); x.fillStyle = '#26272b'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#ffffff'; x.font = '600 64px Archivo, Arial, sans-serif'; x.textBaseline = 'middle'; x.fillText('AquaLOCK', 38, 68);
    const w = x.measureText('AquaLOCK').width; x.font = '500 30px Archivo, Arial'; x.fillText('®', 40 + w, 46);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(.62, .155), new THREE.MeshStandardMaterial({ map: tex, roughness: .5, metalness: .2 }));
    pl.position.set(DR.x1 - .45, DR.h - .32, zd + .04); root.add(pl);
  }
  // sello perimetral (se ilumina)
  const sealG = new THREE.Group(); root.add(sealG);
  const sw = .05, sz = G.z1 + .045;
  [[DR.x0 - fw - sw, DR.x0 - fw, 0, DR.h + fw + sw], [DR.x1 + fw, DR.x1 + fw + sw, 0, DR.h + fw + sw], [DR.x0 - fw - sw, DR.x1 + fw + sw, DR.h + fw, DR.h + fw + sw], [DR.x0 - .12, DR.x1 + .12, .036, .05]].forEach(b => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b[1] - b[0], b[3] - b[2], .02), M.seal);
    m.position.set((b[0] + b[1]) / 2, (b[2] + b[3]) / 2, sz); sealG.add(m);
  });

  /* ---------------- coche ---------------- */
  function car(color = M.white) {
    const g = new THREE.Group();
    const L = 4.2, Wd = 1.78;
    const body = new THREE.Shape();
    body.moveTo(-2.1, .30); body.lineTo(2.0, .30);
    body.quadraticCurveTo(2.12, .32, 2.12, .55); body.quadraticCurveTo(2.12, .86, 1.8, .9);
    body.lineTo(-1.6, .96); body.quadraticCurveTo(-2.1, .95, -2.12, .62); body.quadraticCurveTo(-2.12, .32, -2.1, .30);
    const bev = .14;
    const bg = new THREE.ExtrudeGeometry(body, { depth: Wd - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 20 });
    bg.translate(0, 0, -(Wd - 2 * bev) / 2);
    const bm = new THREE.Mesh(bg, color); g.add(bm);
    const cab = new THREE.Shape();
    cab.moveTo(-1.35, .9); cab.lineTo(1.25, .9);
    cab.quadraticCurveTo(.95, 1.36, .55, 1.4); cab.lineTo(-.85, 1.4);
    cab.quadraticCurveTo(-1.2, 1.38, -1.35, .9);
    const cb = .1, cw = 1.48;
    const cg = new THREE.ExtrudeGeometry(cab, { depth: cw - 2 * cb, bevelEnabled: true, bevelThickness: cb, bevelSize: cb, bevelSegments: 4, curveSegments: 16 });
    cg.translate(0, 0, -(cw - 2 * cb) / 2);
    g.add(new THREE.Mesh(cg, M.carGlass));
    // techo
    const roof = new THREE.Mesh(new RoundedBoxGeometry(1.45, .08, cw - .02, 3, .035), color);
    roof.position.set(-.15, 1.44, 0); g.add(roof);
    // ruedas
    [[1.35, .82], [1.35, -.82], [-1.35, .82], [-1.35, -.82]].forEach(([x, z]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .24, 32), M.tire);
      w.rotation.x = Math.PI / 2; w.position.set(x, .33, z); g.add(w);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .245, 24), M.white);
      hub.rotation.x = Math.PI / 2; hub.position.set(x, .33, z); g.add(hub);
    });
    return shadow(g);
  }
  const carOut = car(); carOut.position.set(-1.0, -.12, 3.8); root.add(carOut);
  const carIn = car(); carIn.rotation.y = -Math.PI / 2; carIn.position.set(5.5, 0, -3.3); root.add(carIn);

  /* ---------------- persona (figura de maqueta) ---------------- */
  function person() {
    const g = new THREE.Group(), m = M.white;
    const cap = (r, len, x, y, z, rz = 0, sx = 1) => {
      const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), m);
      k.position.set(x, y, z); k.rotation.z = rz; k.scale.z = sx; g.add(k); return k;
    };
    cap(.075, .72, -.095, .44, 0);  cap(.075, .72, .095, .44, 0);       // piernas
    cap(.17, .36, 0, 1.13, 0, 0, .68);                                   // torso
    cap(.055, .56, -.25, 1.06, 0, .07); cap(.055, .56, .25, 1.06, 0, -.07); // brazos
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.05, .055, .12, 16), m); neck.position.y = 1.5; g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.11, 32, 20), m); head.position.y = 1.64; head.scale.set(.92, 1.06, 1); g.add(head);
    return shadow(g);
  }
  const per = person(); per.position.set(2.0, 0, 1.15);  per.rotation.y = .5; root.add(per);

  /* ---------------- agua ---------------- */
  const WA = { x0: PL.x0 + .25, x1: PL.x1 - .25, z0: 0, z1: PL.z1 - .3, yb: -.12 };
  const wGeo = new THREE.BoxGeometry(1, 1, 1); wGeo.translate(.5, .5, .5);
  const water = new THREE.Mesh(wGeo, M.water);
  water.position.set(WA.x0, WA.yb, WA.z0); water.renderOrder = 2;
  const wEdges = new THREE.LineSegments(new THREE.EdgesGeometry(wGeo), M.waterEdge); water.add(wEdges);
  root.add(water);
  // superficie con brillo ondulado
  const nCan = document.createElement('canvas'); nCan.width = nCan.height = 256;
  { const x = nCan.getContext('2d'), img = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const a = Math.PI * 2 / 256;
      const dx = .5 * Math.cos(i * a * 3 + Math.sin(j * a * 2) * 1.5) + .3 * Math.cos((i + j) * a * 5);
      const dy = .5 * Math.cos(j * a * 4 + Math.sin(i * a * 2) * 1.2) + .3 * Math.sin((i - j) * a * 3);
      const k = (j * 256 + i) * 4; img.data[k] = 128 + dx * 60; img.data[k + 1] = 128 + dy * 60; img.data[k + 2] = 255; img.data[k + 3] = 255;
    } x.putImageData(img, 0, 0); }
  const nTex = new THREE.CanvasTexture(nCan); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping; nTex.repeat.set(4, 2);
  M.waterTop.normalMap = nTex; M.waterTop.normalScale.set(.35, .35);
  const wTop = new THREE.Mesh(new THREE.PlaneGeometry(WA.x1 - WA.x0, WA.z1 - WA.z0), M.waterTop);
  wTop.rotation.x = -Math.PI / 2; wTop.position.set((WA.x0 + WA.x1) / 2, 0, (WA.z0 + WA.z1) / 2); wTop.renderOrder = 3;
  root.add(wTop);

  /* ---------------- luces ---------------- */
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9dce6', .75));
  const sun = new THREE.DirectionalLight('#ffffff', 2.3);
  sun.position.set(14, 20, 12); sun.target.position.set(0, 0, -1);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 6; sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
  scene.add(sun, sun.target);

  /* ---------------- cámara ---------------- */
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
  const qs = new URLSearchParams(location.search);
  const v3 = new THREE.Vector3();
  const TARGET = new THREE.Vector3(...(qs.get('target') || '1.4,2.0,-1.2').split(',').map(Number));
  const VIEW = +(qs.get('view') || 34);   // ancho visible en metros
  const EL = +(qs.get('el') || 30) * Math.PI / 180, AZ0 = +(qs.get('az') || 30), SWAY = 4;
  const PAD = { l: 250, r: 110, t: 40, b: 30 };   // margen en px de diseño (1200x500)
  // encuadre: el producto manda; el resto entra cortado
  const FITPTS = [
    [DR.x0 - 1.0, 0, G.z1], [DR.x1 + .4, 0, G.z1], [DR.x0, 3.0, G.z1], [G.x1, G.h, G.z0 + 1.2],   // garaje + interior
    [G.x1 + 1.3, 2.3, .15], [G.x1 + 1.3, 0, .15],                                                  // cota
    [-1.3, 0, 3.6], [-1.3, 1.5, 3.6],                                                              // coche (mitad)
    [G.x1, 0, 3.4]                                                                                  // calle
  ];
  function orient(azDeg) {
    const az = azDeg * Math.PI / 180, R = 60;
    cam.position.set(TARGET.x + R * Math.sin(az) * Math.cos(EL), TARGET.y + R * Math.sin(EL), TARGET.z + R * Math.cos(az) * Math.cos(EL));
    cam.lookAt(TARGET); cam.updateMatrixWorld();
  }
  let FR = null;
  function fitFrame() {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    [-SWAY, 0, SWAY].forEach(d => {
      orient(AZ0 + d);
      FITPTS.forEach(p => { v3.set(p[0], p[1], p[2]).applyMatrix4(cam.matrixWorldInverse); x0 = Math.min(x0, v3.x); x1 = Math.max(x1, v3.x); y0 = Math.min(y0, v3.y); y1 = Math.max(y1, v3.y); });
    });
    const k = Math.min(cw / W, ch / H);
    const aw = cw - (PAD.l + PAD.r) * k, ah = ch - (PAD.t + PAD.b) * k;
    const u = Math.max((x1 - x0) / aw, (y1 - y0) / ah);          // metros por px
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const ox = ((PAD.l - PAD.r) * k) / 2 * u, oy = ((PAD.b - PAD.t) * k) / 2 * u;
    FR = { l: cx - ox - cw / 2 * u, r: cx - ox + cw / 2 * u, t: cy - oy + ch / 2 * u, b: cy - oy - ch / 2 * u };
  }
  function setCamera(t) {
    if (!FR) fitFrame();
    orient(AZ0 + SWAY * Math.sin(2 * Math.PI * t / DUR));
    cam.left = FR.l; cam.right = FR.r; cam.top = FR.t; cam.bottom = FR.b;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }

  /* ---------------- capa SVG (HUD, cota, rótulos) ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); host.appendChild(svg);
  const mk = (tag, a, p = svg) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  let cw = W, ch = H;
    const pr = (x, y, z) => { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2 * cw, (1 - v3.y) / 2 * ch]; };

  // cota
  const CX = G.x1 + 1.0, CZ = .15;
  const gA = mk('g', {});
  const cotaLine = mk('path', { stroke: C.grey, 'stroke-width': 1, fill: 'none' }, gA);
  const cotaTicks = mk('path', { stroke: C.grey, 'stroke-width': 1, fill: 'none' }, gA);
  const tickTxt = [.5, 1, 1.5, 2].map(z => { const t = mk('text', { 'font-family': FONT, 'font-size': 10.5, fill: C.grey }, gA); t.textContent = z.toFixed(1).replace('.', ','); return [z, t]; });
  const unitTxt = mk('text', { 'font-family': FONT, 'font-size': 10.5, fill: C.grey }, gA); unitTxt.textContent = 'm';
  const gM = mk('g', {}, gA);
  const mLine = mk('path', { stroke: C.blueDark, 'stroke-width': 1, 'stroke-dasharray': '3 3', fill: 'none' }, gM);
  const mTri = mk('path', { fill: C.blueDark }, gM);
  const mTxt = mk('text', { 'font-family': FONT, 'font-size': 12.5, 'font-weight': 600, fill: C.blueDark, 'font-variant-numeric': 'tabular-nums' }, gM);
  const maxEl = mk('path', { fill: 'none', stroke: C.orange, 'stroke-width': 2.2, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, gA);
  const gTag = mk('g', {}, gA);
  const tagR = mk('rect', { height: 30, rx: 6, fill: C.orange }, gTag);
  const tagT = mk('text', { 'font-family': FONT, 'font-size': 16, 'font-weight': 500, fill: '#1e1e1e' }, gTag); tagT.textContent = '1,6 m';

  // rótulos
  const callouts = [];
  function callout(anchor, dx, dy, title, ref, active, o) {
    const g = mk('g', { opacity: 0 });
    const ln = mk('path', { stroke: C.grey, 'stroke-width': 1, fill: 'none' }, g);
    const dot = mk('circle', { r: 3, fill: '#fff', stroke: C.grey, 'stroke-width': 1.2 }, g);
    const box = mk('rect', { rx: 6, fill: '#fff', stroke: '#e3e5ec', 'stroke-width': 1, height: 44 }, g);
    const t1 = mk('text', { 'font-family': FONT, 'font-size': 13, 'font-weight': 600, fill: C.ink }, g); t1.textContent = title;
    const t2 = mk('text', { 'font-family': FONT, 'font-size': 11.5, fill: C.grey }, g); t2.textContent = ref;
    const t3 = mk('text', { 'font-family': FONT, 'font-size': 11.5, 'font-weight': 500, fill: C.blueDark, opacity: 0 }, g); t3.textContent = active;
    const c = Object.assign({ g, ln, dot, box, t1, t2, t3, anchor, dx, dy, w: 0 }, o);
    callouts.push(c); return c;
  }
  callout(() => per.localToWorld(new THREE.Vector3(0, 1.78, 0)), 40, -62, 'Persona · 1,75 m', 'Altura de referencia', 'El agua llega a los hombros', { zAct: 1.45, tIn: .1, side: 'r' });
  callout(() => carOut.localToWorld(new THREE.Vector3(-.2, 1.5, 0)), -36, -70, 'Coche · 1,48 m', 'Altura de referencia', 'Totalmente cubierto', { zAct: 1.48, tIn: .25, side: 'l' });
  callout(() => carIn.localToWorld(new THREE.Vector3(-.2, 1.5, 0)), 70, -64, 'Interior del garaje', 'Sellado perimetral AquaLOCK®', 'Seco · 0 L de filtración', { tIn: 6.0, tAct: 6.1, side: 'r' });

  // HUD
  const vdefs = mk('defs', {});
  const vg = mk('radialGradient', { id: 'aqveil', cx: 0, cy: 0, r: 1 }, vdefs);
  mk('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': .9 }, vg); mk('stop', { offset: .55, 'stop-color': '#fff', 'stop-opacity': .75 }, vg); mk('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, vg);
  const veil = mk('rect', { x: 0, y: 0, width: 520, height: 300, fill: 'url(#aqveil)' });
  svg.insertBefore(veil, svg.firstChild); svg.insertBefore(vdefs, svg.firstChild);
  const hud = mk('g', {});
  const hx = 40, hy = 44;
  const h1 = mk('text', { x: hx, y: hy, 'font-family': FONT, 'font-size': 11, 'font-weight': 600, 'letter-spacing': 1.6, fill: C.grey }, hud); h1.textContent = 'NIVEL DEL AGUA';
  const hv = mk('text', { x: hx - 2, y: hy + 44, 'font-family': FONT, 'font-size': 44, 'font-weight': 500, fill: C.ink, 'font-variant-numeric': 'tabular-nums', 'letter-spacing': -.5 }, hud);
  const hvN = mk('tspan', {}, hv); hvN.textContent = '0,00';
  const hvU = mk('tspan', { 'font-size': 20, dx: 6, fill: C.grey }, hv); hvU.textContent = 'm';
  const barW = 190;
  mk('rect', { x: hx, y: hy + 60, width: barW, height: 3, rx: 1.5, fill: C.hair }, hud);
  const barF = mk('rect', { x: hx, y: hy + 60, width: 0, height: 3, rx: 1.5, fill: C.blue }, hud);
  const h2 = mk('text', { x: hx, y: hy + 82, 'font-family': FONT, 'font-size': 11.5, fill: C.grey }, hud); h2.textContent = 'Altura de protección AquaLOCK®: 1,6 m';
  const hs = mk('g', { opacity: 0 }, hud);
  mk('circle', { cx: hx + 5, cy: hy + 105, r: 5, fill: C.blue }, hs);
  mk('path', { d: `M${hx + 2.6} ${hy + 105}l1.8 1.9 3.4-3.6`, stroke: '#fff', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hs);
  const hst = mk('text', { x: hx + 16, y: hy + 109, 'font-family': FONT, 'font-size': 13, 'font-weight': 600, fill: C.ink }, hs); hst.textContent = 'Contención total, sin filtraciones';

  function layout() {
    callouts.forEach(c => { c.w = Math.max(c.t1.getComputedTextLength(), c.t2.getComputedTextLength(), c.t3.getComputedTextLength()) + 24; });
    tagR.setAttribute('width', tagT.getComputedTextLength() + 22);
  }

  /* ---------------- tamaño ---------------- */
  function resize() {
    const r = host.getBoundingClientRect();
    cw = Math.max(1, r.width); ch = Math.max(1, r.height);
    renderer.setSize(cw, ch, false); FR = null;
    svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
    // el HUD está diseñado para 1200x500: escalarlo proporcionalmente
    const k = Math.min(cw / W, ch / H) ;
    hud.setAttribute('transform', `scale(${k})`); veil.setAttribute('transform', `scale(${k})`);
    svg.style.setProperty('--k', k);
  }

  /* ---------------- render ---------------- */
  const P = (a) => `${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
  function level(t) {
    if (t < 8.6) return HMAX * es(seg(t, .8, 5.6));
    return HMAX * (1 - eio(seg(t, 8.6, 9.7)));
  }
  function render(t) {
    t = ((t % DUR) + DUR) % DUR;
    setCamera(t);
    const h = level(t);
    const k = Math.min(cw / W, ch / H);
    // agua
    water.visible = wTop.visible = h > .005;
    water.scale.set(WA.x1 - WA.x0, h - WA.yb, WA.z1 - WA.z0);
    wTop.position.y = h + .002;
    nTex.offset.set(t * .03, t * .018);
    // sello
    const glow = eo(seg(t, 5.7, 6.4)) * (1 - eio(seg(t, 8.6, 9.2)));
    M.seal.opacity = .95 * glow;

    renderer.render(scene, cam);

    // ----- capa SVG -----
    const fade = 1 - eio(seg(t, 8.6, 9.1));
    // cota
    const c0 = pr(CX, 0, CZ), c1 = pr(CX, 2.2, CZ);
    cotaLine.setAttribute('d', `M${P(c0)}L${P(c1)}`);
    let td = '';
    for (let z = 0; z <= 2.001; z += .25) { const big = Math.abs(z * 2 - Math.round(z * 2)) < 1e-6; const a = pr(CX, z, CZ); td += `M${(a[0] - (big ? 8 : 4) * k).toFixed(1)} ${a[1].toFixed(1)}h${((big ? 8 : 4) * k).toFixed(1)}`; }
    cotaTicks.setAttribute('d', td);
    tickTxt.forEach(([z, el]) => { const a = pr(CX, z, CZ); el.setAttribute('x', a[0] + 7 * k); el.setAttribute('y', a[1] + 3.5 * k); el.setAttribute('font-size', 10.5 * k); });
    unitTxt.setAttribute('x', c1[0] + 7 * k); unitTxt.setAttribute('y', c1[1] - 4 * k); unitTxt.setAttribute('font-size', 10.5 * k);
    // marcador
    gM.setAttribute('opacity', (h > .01 ? 1 - eo(seg(t, 5.7, 6.1)) : 0).toFixed(3));
    if (h > .005) {
      const A = pr(WA.x1, h, CZ), B = pr(CX, h, CZ);
      mLine.setAttribute('d', `M${P(A)}L${(B[0] - 2).toFixed(1)} ${B[1].toFixed(1)}`);
      mTri.setAttribute('d', `M${(B[0] + 1).toFixed(1)} ${B[1].toFixed(1)}l${-7 * k} ${-4 * k}v${8 * k}z`);
      mTxt.setAttribute('x', (B[0] + 36 * k).toFixed(1)); mTxt.setAttribute('y', (B[1] + 4.5 * k).toFixed(1)); mTxt.setAttribute('font-size', 12.5 * k);
      mTxt.textContent = fmt(h) + ' m';
    }
    // línea máxima y etiqueta
    const pm = eio(seg(t, 5.6, 6.3)) * fade;
    const m0 = pr(G.x0 - .3, HMAX, G.z1 + .02), m1 = pr(CX, HMAX, CZ);
    maxEl.setAttribute('d', `M${P(m0)}L${P(m1)}`);
    maxEl.setAttribute('stroke-width', 2.2 * k);
    maxEl.setAttribute('stroke-dashoffset', (1 - pm).toFixed(4));
    maxEl.setAttribute('visibility', pm <= 0 ? 'hidden' : 'visible');
    const tg = eo(seg(t, 6.0, 6.4)) * fade;
    gTag.setAttribute('opacity', tg.toFixed(3));
    gTag.setAttribute('transform', `translate(${(m1[0] + 36 * k).toFixed(1)} ${(m1[1] - 15 * k).toFixed(1)}) scale(${k})`);
    tagT.setAttribute('x', 11); tagT.setAttribute('y', 20.5);
    gA.setAttribute('opacity', eo(seg(t, .0, .6)).toFixed(3));
    // rótulos
    callouts.forEach(c => {
      const a = c.anchor(), A = pr(a.x, a.y, a.z);
      const vin = eo(seg(t, c.tIn, c.tIn + .5)) * (c.tAct != null ? fade : 1);
      c.g.setAttribute('opacity', vin.toFixed(3));
      const L = [A[0] + c.dx * k, A[1] + c.dy * k];
      c.ln.setAttribute('d', `M${P(A)}L${P(L)}`);
      c.dot.setAttribute('cx', A[0]); c.dot.setAttribute('cy', A[1]); c.dot.setAttribute('r', 3 * k);
      const w = c.w * k, hh = 44 * k, x = c.side === 'r' ? L[0] : L[0] - w, y = L[1] - hh / 2;
      Object.entries({ x, y, width: w, height: hh, rx: 6 * k }).forEach(([kk, v]) => c.box.setAttribute(kk, v));
      [c.t1, c.t2, c.t3].forEach((el, i) => { el.setAttribute('x', x + 12 * k); el.setAttribute('y', y + (i ? 34 : 18) * k); el.setAttribute('font-size', (i ? 11.5 : 13) * k); });
      const act = c.zAct != null ? cl((h - c.zAct + .04) / .08) : eo(seg(t, c.tAct, c.tAct + .4)) * fade;
      c.t2.setAttribute('opacity', (1 - act).toFixed(3)); c.t3.setAttribute('opacity', act.toFixed(3));
      const col = act > .5 ? C.blueDark : C.grey;
      c.ln.setAttribute('stroke', col); c.dot.setAttribute('stroke', col);
      c.box.setAttribute('fill', act > .5 ? C.blueSoft : '#fff'); c.box.setAttribute('stroke', act > .5 ? '#d5dbff' : '#e3e5ec');
    });
    // HUD
    hvN.textContent = fmt(h);
    barF.setAttribute('width', (barW * h / HMAX).toFixed(1));
    const st = eo(seg(t, 6.2, 6.7)) * fade;
    hs.setAttribute('opacity', st.toFixed(3));
  }

  /* ---------------- reproducción ---------------- */
  let raf = 0, t0 = 0, tOff = 0, playing = false;
  const frame = now => { if (!playing) return; render((now - t0) / 1000 + tOff); raf = requestAnimationFrame(frame); };
  const play = () => { if (playing) return; playing = true; t0 = performance.now(); raf = requestAnimationFrame(frame); };
  const pause = () => { if (!playing) return; playing = false; cancelAnimationFrame(raf); tOff += (performance.now() - t0) / 1000; };

  resize(); layout();
  new ResizeObserver(() => { resize(); if (!playing) render(tOff); }).observe(host);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  render(reduce ? 7.5 : 0);
  if (opts.autoplay !== false && !reduce) {
    if ('IntersectionObserver' in window) new IntersectionObserver(es2 => es2.forEach(e => e.isIntersecting ? play() : pause()), { threshold: .2 }).observe(host);
    else play();
  }
  return { render, play, pause, DUR };
}

const boot = async () => {
  try { await Promise.all([document.fonts.load('600 13px Archivo'), document.fonts.load('500 44px Archivo'), document.fonts.load('400 11px Archivo')]); } catch (e) { }
  const hosts = document.querySelectorAll('.aq3d');
  hosts.forEach((h, i) => {
    const capture = new URLSearchParams(location.search).has('capture');
    const inst = create(h, { capture, autoplay: !capture, pixelRatio: capture ? 1 : undefined });
    if (i === 0) window.__aq = inst;
  });
};
boot();

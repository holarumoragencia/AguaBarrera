/*!
 * AquaLOCK® · Animación "Altura de protección"
 * Estilo: dibujo técnico isométrico, minimal / premium.
 * Uso:  <svg class="aq-altura"></svg>  +  <script src="altura-proteccion.js"></script>
 *       (se inicializa sola en todo <svg class="aq-altura">)
 * API:  AquaAltura(svgEl, {autoplay:true}) -> {render(t), play(), pause(), DUR}
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    ink: '#313134', line: '#5d6172', soft: '#b3b6c3', hair: '#eceef2',
    top: '#ffffff', front: '#f6f7f9', side: '#e8eaf0', floor: '#fbfbfd',
    doorLine: '#56575e', blue: '#728AFB', blueDark: '#4a5fd0', blueSoft: '#F1F3FF',
    orange: '#FF914D', grey: '#797D8E'
  };
  var FONT = '"Archivo", Roboto, Arial, sans-serif';
  var DUR = 10, HMAX = 1.6;

  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var seg = function (t, a, b) { return cl((t - a) / (b - a)); };
  var eio = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var eo = function (x) { return 1 - Math.pow(1 - x, 3); };
  var es = function (x) { return (1 - Math.cos(Math.PI * x)) / 2; };
  var fmt = function (v) { return v.toFixed(2).replace('.', ','); };

  function AquaAltura(svg, opts) {
    opts = Object.assign({ autoplay: true }, opts || {});
    var W = 1200, H = 500;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Animación: el nivel del agua sube de 0 a 1,6 m, cubre un coche y llega a los hombros de un adulto; la puerta basculante AquaLOCK® lo contiene y el interior del garaje queda seco.');
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    function mk(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    }

    /* ---------- proyección axonométrica ---------- */
    var ax = 15 * Math.PI / 180, ay = 47 * Math.PI / 180, ky = .9;
    var ux = [Math.cos(ax), Math.sin(ax)], uy = [-Math.cos(ay) * ky, Math.sin(ay) * ky];
    var V = [-uy[0], ux[0], ux[0] * uy[1] - uy[0] * ux[1]];   // dirección hacia el observador
    var S = 1, OX = 0, OY = 0;
    function raw(p) { return [p[0] * ux[0] + p[1] * uy[0], p[0] * ux[1] + p[1] * uy[1] - p[2]]; }
    function pr(p) { var r = raw(p); return [r[0] * S + OX, r[1] * S + OY]; }
    function dep(p) { return p[0] * V[0] + p[1] * V[1] + p[2] * V[2]; }
    function D(pts, open) {
      var s = '';
      for (var i = 0; i < pts.length; i++) { var q = pr(pts[i]); s += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
      return s + (open ? '' : 'Z');
    }

    /* ---------- escena (metros) ---------- */
    var SL = { x0: -2.2, x1: 13.6, y0: -6.0, y1: 4.5, th: .28 };     // losa
    var G = { x0: 5.6, x1: 10.4, y0: -5.4, y1: 0, h: 2.6, t: .2 };   // garaje
    var DR = { x0: 6.3, x1: 9.7, h: 2.25 };                           // puerta
    var WA = { x0: -1.8, x1: 11.8, y0: 0, y1: 3.9 };                 // volumen de agua
    var CX = 12.6;                                                   // eje de cota
    var PER = { x: .25, y1: 3.2, d: .24 };
    var CAR = { x0: 1.35, y0: .95, y1: 2.65 };

    var fit = [];
    [SL.x0, SL.x1].forEach(function (x) { [SL.y0, SL.y1].forEach(function (y) { fit.push([x, y, 0], [x, y, -SL.th]); }); });
    [G.x0, G.x1].forEach(function (x) { [G.y0, G.y1].forEach(function (y) { fit.push([x, y, G.h]); }); });
    fit.push([CX, 0, 2.3]);
    var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    fit.forEach(function (p) { var r = raw(p); mnx = Math.min(mnx, r[0]); mxx = Math.max(mxx, r[0]); mny = Math.min(mny, r[1]); mxy = Math.max(mxy, r[1]); });
    var pad = { l: 80, r: 60, t: 30, b: 18 };
    S = Math.min((W - pad.l - pad.r) / (mxx - mnx), (H - pad.t - pad.b) / (mxy - mny));
    OX = pad.l + ((W - pad.l - pad.r) - (mxx - mnx) * S) / 2 - mnx * S;
    OY = pad.t + ((H - pad.t - pad.b) - (mxy - mny) * S) / 2 - mny * S;

    /* ---------- defs ---------- */
    var defs = mk('defs', {});
    function grad(id, a, b) {
      var g = mk('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      mk('stop', { offset: 0, 'stop-color': C.blue, 'stop-opacity': a }, g);
      mk('stop', { offset: 1, 'stop-color': C.blueDark, 'stop-opacity': b }, g);
    }
    var uid = 'aq' + Math.random().toString(36).slice(2, 7);
    grad(uid + 'f', .22, .40); grad(uid + 's', .30, .50);

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' });
    var scene = mk('g', {});

    /* ---------- trazado animado ---------- */
    var draws = [];
    function path(parent, d, o) {
      var hasFill = o.fill && o.fill !== 'none';
      var el = mk('path', {
        d: d, fill: hasFill ? o.fill : 'none', 'fill-opacity': 0,
        stroke: o.stroke || C.line, 'stroke-width': o.sw || 1, 'stroke-opacity': o.so == null ? 1 : o.so,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1
      }, parent);
      if (o.stroke === 'none') el.removeAttribute('stroke-dasharray');
      draws.push({ el: el, t0: o.t0, t1: o.t1, fo: hasFill ? (o.fo == null ? 1 : o.fo) : 0, dash: o.stroke !== 'none', last: -1 });
      return el;
    }
    function face(parent, pts, fill, t0, t1, o) {
      o = Object.assign({}, o || {}); o.fill = fill; o.t0 = t0; o.t1 = t1;
      return path(parent, D(pts), o);
    }
    function line(parent, pts, t0, t1, o) {
      o = Object.assign({}, o || {}); o.t0 = t0; o.t1 = t1;
      return path(parent, D(pts, true), o);
    }
    function boxDraw(parent, x0, x1, y0, y1, z0, z1, t0, t1, o) {
      o = o || {};
      face(parent, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], o.side || C.side, t0, t1, o);
      face(parent, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], o.front || C.front, t0, t1, o);
      face(parent, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], o.top || C.top, t0, t1, o);
    }
    // perfil (a,z) extruido en Y: cara cercana yN, lejana yF
    function extrude(parent, prof, x0, yF, yN, t0, t1, o) {
      o = o || {};
      var n = prof.length, A = 0, i;
      for (i = 0; i < n; i++) { var p = prof[i], q = prof[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
      var sg = A > 0 ? 1 : -1, qs = [], vis = [];
      for (i = 0; i < n; i++) {
        var a = prof[i], b = prof[(i + 1) % n];
        var nx = (b[1] - a[1]) * sg, nz = -(b[0] - a[0]) * sg, L = Math.hypot(nx, nz) || 1;
        vis[i] = (nx * V[0] + nz * V[2]) > 1e-6;
        if (!vis[i]) continue;
        var P = [[x0 + a[0], yF, a[1]], [x0 + b[0], yF, b[1]], [x0 + b[0], yN, b[1]], [x0 + a[0], yN, a[1]]];
        qs.push({ P: P, dp: (dep(P[0]) + dep(P[1]) + dep(P[2]) + dep(P[3])) / 4, up: nz / L });
      }
      qs.sort(function (u, v) { return u.dp - v.dp; });
      qs.forEach(function (q) {
        var f = q.up > .55 ? C.top : C.side;
        face(parent, q.P, f, t0, t1, { stroke: f, sw: .6 });
      });
      // contorno trasero visible + aristas de silueta
      var back = '';
      for (i = 0; i < n; i++) {
        if (!vis[i]) continue;
        var a2 = prof[i], b2 = prof[(i + 1) % n];
        back += D([[x0 + a2[0], yF, a2[1]], [x0 + b2[0], yF, b2[1]]], true);
      }
      if (back) path(parent, back, { t0: t0, t1: t1, sw: o.sw || .9 });
      for (i = 0; i < n; i++) {
        var prev = vis[(i - 1 + n) % n], cur = vis[i];
        var pa = prof[(i - 1 + n) % n], pb = prof[i], pc = prof[(i + 1) % n];
        var ang = Math.abs(Math.atan2(pc[1] - pb[1], pc[0] - pb[0]) - Math.atan2(pb[1] - pa[1], pb[0] - pa[0]));
        if (ang > Math.PI) ang = 2 * Math.PI - ang;
        if (prev !== cur || (cur && ang > .45)) line(parent, [[x0 + pb[0], yF, pb[1]], [x0 + pb[0], yN, pb[1]]], t0, t1, { sw: o.sw || .9 });
      }
      return face(parent, prof.map(function (p) { return [x0 + p[0], yN, p[1]]; }), o.front || C.front, t0, t1, { sw: o.sw || 1.1 });
    }
    function circleXZ(cx, cz, r, y, steps) {
      var pts = [];
      for (var i = 0; i < steps; i++) { var a = i / steps * Math.PI * 2; pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); }
      return pts;
    }

    /* ---------- losa ---------- */
    var gBase = mk('g', {}, scene);
    boxDraw(gBase, SL.x0, SL.x1, SL.y0, SL.y1, -SL.th, 0, 0, .9, { sw: 1, front: '#f3f4f7', side: '#e6e8ee' });
    var ylines = '';
    for (var yy = SL.y0 + .55; yy < SL.y1 - .2; yy += .55) {
      if (yy > G.y0 - .15 && yy < G.y1 + .15) {
        ylines += D([[SL.x0 + .35, yy, 0], [G.x0 - .25, yy, 0]], true) + D([[G.x1 + .25, yy, 0], [SL.x1 - .35, yy, 0]], true);
      } else ylines += D([[SL.x0 + .35, yy, 0], [SL.x1 - .35, yy, 0]], true);
    }
    path(gBase, ylines, { t0: .3, t1: 1.3, stroke: C.hair, sw: 1 });

    /* ---------- garaje ---------- */
    var gG = mk('g', {}, scene);
    var tw = G.t;
    boxDraw(gG, G.x0, G.x1, G.y0, G.y0 + tw, 0, G.h, .45, 1.5);
    boxDraw(gG, G.x0, G.x0 + tw, G.y0 + tw, G.y1 - tw, 0, G.h, .5, 1.5);
    var floorEl = face(gG, [[G.x0 + tw, G.y0 + tw, 0], [G.x1 - tw, G.y0 + tw, 0], [G.x1 - tw, G.y1 - tw, 0], [G.x0 + tw, G.y1 - tw, 0]], C.floor, .6, 1.5, { stroke: C.soft, sw: .8 });
    // marcas de plaza de garaje
    line(gG, [[G.x0 + 1.2, G.y0 + .6, 0], [G.x0 + 1.2, G.y1 - .9, 0]], .9, 1.6, { stroke: C.soft, sw: .8 });
    line(gG, [[G.x1 - 1.2, G.y0 + .6, 0], [G.x1 - 1.2, G.y1 - .9, 0]], .9, 1.6, { stroke: C.soft, sw: .8 });
    boxDraw(gG, G.x1 - tw, G.x1, G.y0 + tw, G.y1 - tw, 0, G.h, .55, 1.55);
    // puerta (recedida) + jamba
    var yd = G.y1 - .07;
    var gDoor = mk('g', {}, scene);
    face(gDoor, [[DR.x0, yd, 0], [DR.x1, yd, 0], [DR.x1, yd, DR.h], [DR.x0, yd, DR.h]], C.ink, 1.0, 1.8, { stroke: C.ink, sw: 1 });
    var ribs = '';
    for (var k = 1; k < 6; k++) { var zz = DR.h * k / 6; ribs += D([[DR.x0 + .08, yd, zz], [DR.x1 - .08, yd, zz]], true); }
    ribs += D([[DR.x0 + .08, yd, .06], [DR.x1 - .08, yd, .06], [DR.x1 - .08, yd, DR.h - .06], [DR.x0 + .08, yd, DR.h - .06]]);
    path(gDoor, ribs, { t0: 1.4, t1: 2.1, stroke: C.doorLine, sw: .9 });
    face(gDoor, [[DR.x0, yd, 0], [DR.x0, G.y1, 0], [DR.x0, G.y1, DR.h], [DR.x0, yd, DR.h]], C.side, 1.0, 1.8, { sw: .8 });
    // fachada con hueco
    var fy = G.y1;
    var outer = [[G.x0, fy, 0], [G.x1, fy, 0], [G.x1, fy, G.h], [G.x0, fy, G.h]];
    var hole = [[DR.x0, fy, 0], [DR.x0, fy, DR.h], [DR.x1, fy, DR.h], [DR.x1, fy, 0]];
    var fac = path(gG, D(outer) + D(hole), { fill: C.front, t0: .7, t1: 1.6 });
    fac.setAttribute('fill-rule', 'evenodd');
    gG.appendChild(gDoor); gG.appendChild(fac);
    face(gG, [[G.x0, fy - tw, G.h], [G.x1, fy - tw, G.h], [G.x1, fy, G.h], [G.x0, fy, G.h]], C.top, .7, 1.6);
    face(gG, [[G.x1, fy - tw, 0], [G.x1, fy, 0], [G.x1, fy, G.h], [G.x1, fy - tw, G.h]], C.side, .7, 1.6);
    // sello perimetral (se ilumina al final)
    var seal = mk('path', {
      d: D([[DR.x0, fy + .01, 0], [DR.x0, fy + .01, DR.h], [DR.x1, fy + .01, DR.h], [DR.x1, fy + .01, 0]], true) + D([[DR.x0, fy + .01, .005], [DR.x1, fy + .01, .005]], true),
      fill: 'none', stroke: C.blue, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1
    }, gG);

    /* ---------- coche ---------- */
    var gCar = mk('g', { id: uid + 'car' }, scene);
    var carP = [[0, .30], [.02, .60], [.12, .78], [.95, .92], [1.55, 1.36], [1.78, 1.45], [2.95, 1.48], [3.45, 1.37], [3.76, 1.04], [3.86, .66], [3.84, .30]];
    extrude(gCar, carP, CAR.x0, CAR.y0, CAR.y1, 1.0, 2.0);
    var carBody = { prof: carP, x0: CAR.x0, yF: CAR.y0, yN: CAR.y1 + .02 };
    var yc = CAR.y1 + .005, cx0 = CAR.x0;
    var mapC = function (pts) { return pts.map(function (p) { return [cx0 + p[0], yc, p[1]]; }); };
    face(gCar, mapC([[1.05, .97], [1.58, 1.33], [1.78, 1.40], [2.9, 1.42], [3.36, 1.32], [3.58, 1.0]]), '#eef0f5', 1.3, 2.1, { stroke: C.soft, sw: .9 });
    line(gCar, mapC([[2.28, 1.0], [2.28, 1.41]]), 1.4, 2.1, { stroke: C.soft, sw: .9 });
    line(gCar, mapC([[1.0, .95], [1.05, .42], [3.5, .42], [3.62, .98]]), 1.4, 2.1, { stroke: C.soft, sw: .8 });
    line(gCar, mapC([[2.28, .97], [2.25, .45]]), 1.4, 2.1, { stroke: C.soft, sw: .8 });
    [.78, 3.08].forEach(function (wx) {
      face(gCar, circleXZ(cx0 + wx, .31, .31, yc + .01, 36), '#fff', 1.3, 2.0, { sw: 1.1 });
      face(gCar, circleXZ(cx0 + wx, .31, .15, yc + .012, 28), C.side, 1.5, 2.1, { stroke: C.soft, sw: .9 });
    });

    /* ---------- persona ---------- */
    var gPer = mk('g', { id: uid + 'per' }, scene);
    var half = [[.045, 1.535], [.06, 1.49], [.185, 1.455], [.232, 1.405], [.255, 1.12], [.247, .84], [.226, .78], [.202, .80], [.192, 1.07], [.172, 1.22], [.166, .98], [.158, .55], [.138, .07], [.152, 0], [.035, 0], [.024, .86]];
    var perP = half.slice();
    for (var j = half.length - 1; j >= 0; j--) perP.push([-half[j][0], half[j][1]]);
    for (var ang = 245; ang >= -65; ang -= 12) perP.push([.105 * Math.cos(ang * Math.PI / 180), 1.645 + .105 * Math.sin(ang * Math.PI / 180)]);
    extrude(gPer, perP, PER.x, PER.y1 - PER.d, PER.y1, 1.15, 2.0, { sw: 1 });
    var perBody = { prof: perP, x0: PER.x, yF: PER.y1 - PER.d, yN: PER.y1 };

    /* ---------- agua ---------- */
    var gW = mk('g', {}, scene);
    var wRight = mk('path', { fill: 'url(#' + uid + 's)' }, gW);
    var wFront = mk('path', { fill: 'url(#' + uid + 'f)' }, gW);
    var wTop = mk('path', { fill: C.blue, 'fill-opacity': .11 }, gW);
    var wRip = [];
    for (var r = 0; r < 4; r++) wRip.push(mk('path', { fill: 'none', stroke: '#fff', 'stroke-width': 1.1, 'stroke-linecap': 'round' }, gW));
    var wEdge = mk('path', { fill: 'none', stroke: C.blueDark, 'stroke-width': 1.3, 'stroke-linejoin': 'round', 'stroke-opacity': .9 }, gW);
    var wLine = mk('path', { fill: 'none', stroke: C.blueDark, 'stroke-width': 2, 'stroke-linecap': 'round' }, gW);

    // partes de persona/coche por encima del agua: se redibujan encima, recortadas en 3D
    var clips = [carBody, perBody].map(function (b, i) {
      var cp = mk('clipPath', { id: uid + 'clip' + i }, defs);
      var pool = [];
      var n = b.prof.length + 2;
      for (var k2 = 0; k2 < n + 8; k2++) pool.push(mk('path', {}, cp));
      var u = mk('use', { href: '#' + uid + (i ? 'per' : 'car'), 'clip-path': 'url(#' + uid + 'clip' + i + ')' }, gW);
      return { b: b, pool: pool, use: u };
    });
    function clipAbove(prof, h) {
      var out = [], n2 = prof.length;
      for (var i2 = 0; i2 < n2; i2++) {
        var a = prof[i2], b = prof[(i2 + 1) % n2], ia = a[1] >= h, ib = b[1] >= h;
        if (ia) out.push(a);
        if (ia !== ib) { var tt = (h - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * tt, h]); }
      }
      return out;
    }
    function updateClips(h) {
      clips.forEach(function (c) {
        var q = clipAbove(c.b.prof, h), b = c.b, k3 = 0, i3;
        var m = function (p, y) { return [b.x0 + p[0], y, p[1]]; };
        if (q.length >= 3) {
          c.pool[k3++].setAttribute('d', D(q.map(function (p) { return m(p, b.yN); })));
          c.pool[k3++].setAttribute('d', D(q.map(function (p) { return m(p, b.yF); })));
          for (i3 = 0; i3 < q.length && k3 < c.pool.length; i3++) {
            var a = q[i3], bb = q[(i3 + 1) % q.length];
            c.pool[k3++].setAttribute('d', D([m(a, b.yF), m(bb, b.yF), m(bb, b.yN), m(a, b.yN)]));
          }
        }
        for (; k3 < c.pool.length; k3++) c.pool[k3].setAttribute('d', '');
      });
    }

    /* ---------- cota vertical ---------- */
    var gA = mk('g', {}, scene);
    line(gA, [[CX, 0, 0], [CX, 0, 2.15]], 1.5, 2.3, { stroke: C.grey, sw: 1 });
    var ticks = '';
    var tickLabels = [];
    for (var z = 0; z <= 2.001; z += .25) {
      var big = Math.abs(z * 2 - Math.round(z * 2)) < 1e-6;
      ticks += D([[CX - (big ? .16 : .08), 0, z], [CX, 0, z]], true);
      if (big && z > 0) tickLabels.push(z);
    }
    path(gA, ticks, { t0: 1.7, t1: 2.4, stroke: C.grey, sw: 1 });
    var tlG = mk('g', { opacity: 0 }, gA);
    tickLabels.forEach(function (z) {
      var q = pr([CX, 0, z]);
      var tx = mk('text', { x: q[0] + 7, y: q[1] + 3.5, 'font-family': FONT, 'font-size': 10.5, fill: C.grey }, tlG);
      tx.textContent = z.toFixed(1).replace('.', ',');
    });
    var qTop = pr([CX, 0, 2.15]);
    var unit = mk('text', { x: qTop[0] + 7, y: qTop[1] - 4, 'font-family': FONT, 'font-size': 10.5, fill: C.grey }, tlG);
    unit.textContent = 'm';

    // marcador del nivel actual
    var gM = mk('g', {}, gA);
    var mLine = mk('path', { stroke: C.blueDark, 'stroke-width': 1, 'stroke-dasharray': '3 3', fill: 'none' }, gM);
    var mTri = mk('path', { fill: C.blueDark }, gM);
    var mTxt = mk('text', { 'font-family': FONT, 'font-size': 12.5, 'font-weight': 600, fill: C.blueDark, 'font-variant-numeric': 'tabular-nums' }, gM);

    // línea de altura máxima (naranja, como en la web)
    var maxEl = mk('path', {
      d: D([[G.x0 - .1, .02, HMAX], [CX, .02, HMAX]], true), fill: 'none', stroke: C.orange, 'stroke-width': 2.2,
      'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1
    }, gA);
    var gTag = mk('g', { opacity: 0 }, gA);
    var qMax = pr([CX, 0, HMAX]);
    var tagR = mk('rect', { x: qMax[0] + 36, y: qMax[1] - 15, height: 30, rx: 6, fill: C.orange }, gTag);
    var tagT = mk('text', { x: qMax[0] + 47, y: qMax[1] + 5.5, 'font-family': FONT, 'font-size': 16, 'font-weight': 500, fill: '#1e1e1e' }, gTag);
    tagT.textContent = '1,6 m';

    /* ---------- rótulos ---------- */
    var callouts = [];
    function callout(anchor, dx, dy, title, ref, active, tIn, tAct, side) {
      var g = mk('g', { opacity: 0 }, scene);
      var A = pr(anchor), L = [A[0] + dx, A[1] + dy];
      var ln = mk('path', { d: 'M' + A[0] + ' ' + A[1] + 'L' + L[0] + ' ' + L[1], stroke: C.grey, 'stroke-width': 1, fill: 'none' }, g);
      var dot = mk('circle', { cx: A[0], cy: A[1], r: 3, fill: '#fff', stroke: C.grey, 'stroke-width': 1.2 }, g);
      var box = mk('rect', { rx: 6, fill: '#fff', stroke: '#e3e5ec', 'stroke-width': 1 }, g);
      var t1 = mk('text', { 'font-family': FONT, 'font-size': 13, 'font-weight': 600, fill: C.ink }, g); t1.textContent = title;
      var t2 = mk('text', { 'font-family': FONT, 'font-size': 11.5, fill: C.grey }, g); t2.textContent = ref;
      var t3 = mk('text', { 'font-family': FONT, 'font-size': 11.5, 'font-weight': 500, fill: C.blueDark, opacity: 0 }, g); t3.textContent = active;
      var o = { g: g, ln: ln, dot: dot, box: box, t1: t1, t2: t2, t3: t3, L: L, side: side || (dx >= 0 ? 'r' : 'l'), tIn: tIn, tAct: tAct };
      callouts.push(o);
      return o;
    }
    function layoutCallout(o) {
      var w = Math.max(o.t1.getComputedTextLength(), o.t2.getComputedTextLength(), o.t3.getComputedTextLength()) + 24;
      var h = 44, x = o.side === 'r' ? o.L[0] : o.L[0] - w, y = o.L[1] - h / 2;
      o.box.setAttribute('x', x); o.box.setAttribute('y', y); o.box.setAttribute('width', w); o.box.setAttribute('height', h);
      [o.t1, o.t2, o.t3].forEach(function (t, i) { t.setAttribute('x', x + 12); t.setAttribute('y', y + (i ? 34 : 18)); });
    }
    var cPer = callout([PER.x - .05, PER.y1, 1.62], -40, 4, 'Persona · 1,75 m', 'Altura de referencia', 'El agua llega a los hombros', 2.0, 0, 'l');
    cPer.zAct = 1.45;
    var cCar = callout([CAR.x0 + 2.4, (CAR.y0 + CAR.y1) / 2, 1.48], 30, -64, 'Coche · 1,48 m', 'Altura de referencia', 'Totalmente cubierto', 2.15, 0, 'r');
    cCar.zAct = 1.48;
    var cIn = callout([8.0, G.y0 + .9, 0], 150, -18, 'Interior del garaje', 'Sellado perimetral AquaLOCK®', 'Seco · 0 L de filtración', 7.25, 7.25, 'r');
    cIn.t2.setAttribute('fill', C.grey);

    /* ---------- HUD ---------- */
    var hud = mk('g', { opacity: 0 }, scene);
    var hx = 40, hy = 44;
    var h1 = mk('text', { x: hx, y: hy, 'font-family': FONT, 'font-size': 11, 'font-weight': 600, 'letter-spacing': 1.6, fill: C.grey }, hud); h1.textContent = 'NIVEL DEL AGUA';
    var hv = mk('text', { x: hx - 2, y: hy + 44, 'font-family': FONT, 'font-size': 44, 'font-weight': 500, fill: C.ink, 'font-variant-numeric': 'tabular-nums', 'letter-spacing': -.5 }, hud);
    var hvN = mk('tspan', {}, hv); hvN.textContent = '0,00';
    var hvU = mk('tspan', { 'font-size': 20, dx: 6, fill: C.grey }, hv); hvU.textContent = 'm';
    var barW = 190;
    mk('rect', { x: hx, y: hy + 60, width: barW, height: 3, rx: 1.5, fill: C.hair }, hud);
    var barF = mk('rect', { x: hx, y: hy + 60, width: 0, height: 3, rx: 1.5, fill: C.blue }, hud);
    var h2 = mk('text', { x: hx, y: hy + 82, 'font-family': FONT, 'font-size': 11.5, fill: C.grey }, hud); h2.textContent = 'Altura de protección AquaLOCK®: 1,6 m';
    var hs = mk('g', { opacity: 0 }, hud);
    mk('circle', { cx: hx + 5, cy: hy + 105, r: 5, fill: C.blue }, hs);
    mk('path', { d: 'M' + (hx + 2.6) + ' ' + (hy + 105) + 'l1.8 1.9 3.4-3.6', stroke: '#fff', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hs);
    var hst = mk('text', { x: hx + 16, y: hy + 109, 'font-family': FONT, 'font-size': 13, 'font-weight': 600, fill: C.ink }, hs); hst.textContent = 'Contención total, sin filtraciones';

    /* ---------- render ---------- */
    function setA(el, k, v) { el.setAttribute(k, v); }
    function water(h, t) {
      if (h < .004) { gW.setAttribute('display', 'none'); return; }
      gW.removeAttribute('display');
      var x0 = WA.x0, x1 = WA.x1, y0 = WA.y0, y1 = WA.y1;
      setA(wRight, 'd', D([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]]));
      setA(wFront, 'd', D([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]]));
      setA(wTop, 'd', D([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]]));
      setA(wEdge, 'd', D([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]]) + D([[x1, y1, h], [x1, y1, 0]], true) + D([[x0, y1, h], [x0, y1, 0]], true));
      setA(wLine, 'd', D([[G.x0, y0, h], [G.x1, y0, h]], true));
      updateClips(h);
      for (var i = 0; i < wRip.length; i++) {
        var f = ((i / wRip.length) + t * .07) % 1;
        var yy = y1 - f * (y1 - y0 - .7);
        var a0 = x0 + .6 + (i % 2) * 1.4, a1 = x1 - .6 - ((i + 1) % 2) * 1.6;
        setA(wRip[i], 'd', D([[a0, yy, h], [a1, yy, h]], true));
        setA(wRip[i], 'stroke-opacity', (.6 * Math.sin(Math.PI * f) * cl(h / .25)).toFixed(3));
      }
    }

    function render(t) {
      t = ((t % DUR) + DUR) % DUR;
      var i, a;
      for (i = 0; i < draws.length; i++) {
        a = draws[i];
        var p = eio(seg(t, a.t0, a.t1));
        var key = Math.round(p * 1000) + (a.fo ? Math.round(seg(t, a.t1 - .35, a.t1 + .35) * 1000) * 7919 : 0);
        if (key === a.last) continue; a.last = key;
        if (a.dash) {
          if (p >= 1) { a.el.setAttribute('stroke-dasharray', 'none'); a.el.setAttribute('stroke-dashoffset', 0); }
          else { a.el.setAttribute('stroke-dasharray', '1 1'); a.el.setAttribute('stroke-dashoffset', (1 - p).toFixed(4)); }
          a.el.setAttribute('visibility', p <= 0 ? 'hidden' : 'visible');
        }
        if (a.fo) a.el.setAttribute('fill-opacity', (a.fo * eo(seg(t, a.t1 - .35, a.t1 + .35))).toFixed(3));
      }
      var h = HMAX * es(seg(t, 2.6, 6.8));
      water(h, t);

      // cota
      tlG.setAttribute('opacity', eo(seg(t, 1.9, 2.5)).toFixed(3));
      var showM = h > .01 ? 1 - eo(seg(t, 6.9, 7.3)) : 0;
      gM.setAttribute('opacity', showM.toFixed(3));
      if (h > .004) {
        var A = pr([WA.x1, 0, h]), B = pr([CX, 0, h]);
        setA(mLine, 'd', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + 'L' + (B[0] - 2).toFixed(1) + ' ' + B[1].toFixed(1));
        setA(mTri, 'd', 'M' + (B[0] + 1) + ' ' + B[1].toFixed(1) + 'l-7 -4v8z');
        setA(mTxt, 'x', (B[0] + 36).toFixed(1)); setA(mTxt, 'y', (B[1] + 4.5).toFixed(1));
        mTxt.textContent = fmt(h) + ' m';
      }
      var pm = eio(seg(t, 6.85, 7.5));
      maxEl.setAttribute('stroke-dashoffset', (1 - pm).toFixed(4));
      maxEl.setAttribute('visibility', pm <= 0 ? 'hidden' : 'visible');
      gTag.setAttribute('opacity', eo(seg(t, 7.2, 7.6)).toFixed(3));
      var ps = eio(seg(t, 6.95, 7.8));
      seal.setAttribute('stroke-dashoffset', (1 - ps).toFixed(4));
      seal.setAttribute('visibility', ps <= 0 ? 'hidden' : 'visible');

      // rótulos
      callouts.forEach(function (o) {
        var vin = eo(seg(t, o.tIn, o.tIn + .5));
        o.g.setAttribute('opacity', vin.toFixed(3));
        o.g.setAttribute('transform', 'translate(0 ' + ((1 - vin) * 6).toFixed(2) + ')');
        var act = o.zAct != null ? cl((h - o.zAct + .04) / .08) : eo(seg(t, o.tAct, o.tAct + .4));
        o.t2.setAttribute('opacity', (1 - act).toFixed(3));
        o.t3.setAttribute('opacity', act.toFixed(3));
        var col = act > .5 ? C.blueDark : C.grey;
        o.ln.setAttribute('stroke', col); o.dot.setAttribute('stroke', col);
        o.box.setAttribute('fill', act > .5 ? C.blueSoft : '#fff');
        o.box.setAttribute('stroke', act > .5 ? '#d5dbff' : '#e3e5ec');
      });

      // HUD
      hud.setAttribute('opacity', eo(seg(t, 1.2, 1.9)).toFixed(3));
      hvN.textContent = fmt(h);
      barF.setAttribute('width', (barW * h / HMAX).toFixed(1));
      hs.setAttribute('opacity', eo(seg(t, 7.4, 7.9)).toFixed(3));
      hs.setAttribute('transform', 'translate(0 ' + ((1 - eo(seg(t, 7.4, 7.9))) * 5).toFixed(2) + ')');

      scene.setAttribute('opacity', (1 - eio(seg(t, 9.05, 9.8))).toFixed(3));
    }

    /* ---------- arranque ---------- */
    callouts.forEach(layoutCallout);
    var tagW = tagT.getComputedTextLength() + 22;
    tagR.setAttribute('width', tagW);

    var raf = 0, t0 = 0, tOff = 0, playing = false;
    function frame(now) { if (!playing) return; render((now - t0) / 1000 + tOff); raf = requestAnimationFrame(frame); }
    function play() { if (playing) return; playing = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { if (!playing) return; playing = false; cancelAnimationFrame(raf); tOff += (performance.now() - t0) / 1000; }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    render(reduce ? 8.5 : 0);
    if (opts.autoplay && !reduce) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es2) { es2.forEach(function (e) { e.isIntersecting ? play() : pause(); }); }, { threshold: .25 }).observe(svg);
      } else play();
    }
    return { render: render, play: play, pause: pause, DUR: DUR };
  }

  window.AquaAltura = AquaAltura;
  function boot() {
    var els = document.querySelectorAll('svg.aq-altura');
    var go = function () {
      for (var i = 0; i < els.length; i++) {
        var auto = els[i].getAttribute('data-autoplay') !== 'false';
        var inst = AquaAltura(els[i], { autoplay: auto });
        if (i === 0) window.__aq = inst;
      }
    };
    (document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 13px Archivo'), document.fonts.load('500 44px Archivo'), document.fonts.load('400 11px Archivo')]).then(function () { return document.fonts.ready; }) : Promise.resolve()).then(go, go);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

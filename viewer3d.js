/* Operación Número 13 — visor 3D de objetos (WebGL puro, sin librerías).
   Lee los modelos convertidos con tools/convert_obj.py (assets/modelos/*.bin). */
(function (root) {
  'use strict';
  const BASE = 'assets/modelos/';
  let index = null; const cache = {};
  // rotación inicial (en grados) por modelo si el original viene tumbado
  const ORIENT = { policia: -90, vudu: -90, esqueleto: -90, llave: -90, cartas: -90 }; // grados sobre X (modelos con el «arriba» en Z)

  async function init() {
    if (index) return index;
    try { index = await (await fetch(BASE + 'index.json')).json(); } catch (e) { index = {}; }
    return index;
  }
  const has = (id) => !!(index && index[id]);

  async function load(id) {
    if (cache[id]) return cache[id];
    const meta = index[id], buf = await (await fetch(BASE + id + '.bin')).arrayBuffer();
    const n = meta.n, pad = (b) => b + ((4 - (b % 4)) % 4);
    let o = 0;
    const pos = new Int16Array(buf, o, n * 3); o += pad(n * 6);
    const nor = new Int8Array(buf, o, n * 3); o += pad(n * 3);
    const col = new Uint8Array(buf, o, n * 3); o += pad(n * 3);
    const idx = meta.idx32 ? new Uint32Array(buf, o, meta.m * 3) : new Uint16Array(buf, o, meta.m * 3);
    return (cache[id] = { pos, nor, col, idx, meta });
  }

  /* --- matemáticas mínimas (matrices 4x4 en columnas) --- */
  const mul = (a, b) => { const r = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; };
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  const trans = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };

  const VS = `attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol;
    uniform mat4 uMVP; uniform mat4 uRot; varying vec3 vN; varying vec3 vC; varying vec3 vP;
    void main(){ vN = mat3(uRot[0].xyz, uRot[1].xyz, uRot[2].xyz) * aNor; vC = aCol; vP = aPos; gl_Position = uMVP * vec4(aPos, 1.0); }`;
  const FS = `precision mediump float; varying vec3 vN; varying vec3 vC; varying vec3 vP;
    void main(){
      vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
      vec3 L = normalize(vec3(-0.5, 0.8, 0.9)); vec3 V = vec3(0.0, 0.0, 1.0);
      float d = max(dot(n, L), 0.0); float fill = max(dot(n, normalize(vec3(0.7, -0.2, 0.5))), 0.0) * 0.25;
      float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.28;
      vec3 H = normalize(L + V); float sp = pow(max(dot(n, H), 0.0), 40.0) * 0.22;
      vec3 c = vC * (0.42 + 0.78 * d + fill) + vec3(1.0, 0.9, 0.8) * (rim + sp);
      gl_FragColor = vec4(c, 1.0);
    }`;

  function compile(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }

  // monta un visor dentro de `box`; devuelve { dispose() } o null si no hay WebGL
  async function mount(box, id) {
    await init(); if (!has(id)) return null;
    const cv = document.createElement('canvas'); cv.className = 'v3d';
    const gl = cv.getContext('webgl', { antialias: true, alpha: true }) || cv.getContext('experimental-webgl');
    if (!gl) return null;
    const ext32 = gl.getExtension('OES_element_index_uint');
    let m; try { m = await load(id); } catch (e) { return null; }
    if (m.meta.idx32 && !ext32) return null;
    box.append(cv);

    const pr = gl.createProgram();
    gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = (data, loc, type, norm) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); const a = gl.getAttribLocation(pr, loc); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, type, norm, 0, 0); return b; };
    const bufs = [buf(m.pos, 'aPos', gl.SHORT, true), buf(m.nor, 'aNor', gl.BYTE, true), buf(m.col, 'aCol', gl.UNSIGNED_BYTE, true)];
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    const uMVP = gl.getUniformLocation(pr, 'uMVP'), uRot = gl.getUniformLocation(pr, 'uRot');
    gl.enable(gl.DEPTH_TEST);

    // radio de la esfera que contiene el modelo (para encuadrarlo siempre entero)
    let rad = 0; for (let i = 0; i < m.pos.length; i += 3) { const x = m.pos[i] / 32767, y = m.pos[i + 1] / 32767, z = m.pos[i + 2] / 32767; const r = Math.sqrt(x * x + y * y + z * z); if (r > rad) rad = r; }
    const FOV = 0.7, TAN = Math.tan(FOV / 2);
    const base = (ORIENT[id] || 0) * Math.PI / 180;
    let spin = true, zoom = 1, yaw = 0.5, pitch = -0.25, roll = 0, dist = 3.1, last = performance.now(), idle = 0, drag = null, alive = true, raf = 0;
    const pts = new Map();
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); idle = 0; });
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId);
      if (pts.size === 1) { yaw += (e.clientX - p[0]) * 0.012; pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - p[1]) * 0.012)); }
      else if (pts.size === 2) { const q = [...pts.entries()].find(([k]) => k !== e.pointerId)[1]; const d0 = Math.hypot(p[0] - q[0], p[1] - q[1]), d1 = Math.hypot(e.clientX - q[0], e.clientY - q[1]); zoom = Math.max(0.5, Math.min(2.2, zoom * d0 / (d1 || 1))); }
      pts.set(e.pointerId, [e.clientX, e.clientY]); idle = 0;
    });
    const up = (e) => { pts.delete(e.pointerId); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(0.5, Math.min(2.2, zoom * (1 + Math.sign(e.deltaY) * 0.1))); idle = 0; }, { passive: false });

    const draw = () => {
      if (!alive) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(2, Math.floor(box.clientWidth * dpr)), h = Math.max(2, Math.floor(box.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const now = performance.now(), dt = (now - last) / 1000; last = now; idle += dt;
      if (spin && pts.size === 0 && idle > 1.2) yaw += dt * 0.8;
      dist = (rad * 1.06) / (TAN * Math.min(1, w / h)) * zoom;
      const R = mul(rotX(pitch), mul(rotY(yaw), rotX(base)));
      const mvp = mul(persp(FOV, w / h, 0.1, 40), mul(trans(0, 0, -dist), R));
      gl.uniformMatrix4fv(uMVP, false, mvp); gl.uniformMatrix4fv(uRot, false, R);
      gl.drawElements(gl.TRIANGLES, m.idx.length, m.meta.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return { set(y, p, r) { spin = false; yaw = y; pitch = p; if (r !== undefined) roll = r; }, dispose() { alive = false; cancelAnimationFrame(raf); bufs.forEach((b) => gl.deleteBuffer(b)); gl.deleteBuffer(ib); const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); cv.remove(); } };
  }
  root.Viewer3D = { init, has, mount };
})(window);

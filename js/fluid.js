/* ==========================================================
   Rafaq Tec — hero fluid (WebGL)
   A small "stable fluids" simulation: moving the pointer pushes the
   water and drops ink in the logo colours, which swirls, marbles and
   fades quickly. Returns null when the device can't run it, so the
   caller can fall back to the simpler canvas effect.
   ========================================================== */
window.RafaqFluid = function (canvas, opts) {
  "use strict";
  const o = Object.assign({
    lite: false,
    simRes: 128,
    dyeRes: 900,
    dyeFade: 3.4,          // higher = shorter trail
    velFade: 1.1,
    pressure: 0.8,
    pressureIters: 20,
    curl: 22,              // swirl strength: the marbled curls
    radius: 0.12,          // splat size (percent of screen)
    force: 5200,
    bright: 0.22,          // ink brightness (kept low so text stays readable)
    glow: 1.1,             // strength of the soft glow around the ink
    bg: [1 / 255, 7 / 255, 20 / 255],        // hero background
    pageBg: [1 / 255, 12 / 255, 33 / 255],   // page background, faded in at the bottom
    palette: [[84, 239, 228], [9, 221, 236], [1, 108, 240], [1, 95, 179]],
  }, opts || {});
  if (o.lite) { o.simRes = 64; o.dyeRes = 320; o.pressureIters = 12; }

  // ---------- Context and formats ----------
  const params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  let gl = canvas.getContext("webgl2", params);
  const isGL2 = !!gl;
  if (!gl) gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
  if (!gl) return null;

  let halfFloat, formatRGBA, formatRG, formatR;
  if (isGL2) {
    if (!gl.getExtension("EXT_color_buffer_float")) return null;
    halfFloat = gl.HALF_FLOAT;
    formatRGBA = [gl.RGBA16F, gl.RGBA];
    formatRG = [gl.RG16F, gl.RG];
    formatR = [gl.R16F, gl.RED];
  } else {
    const hf = gl.getExtension("OES_texture_half_float");
    if (!hf || !gl.getExtension("OES_texture_half_float_linear")) return null;
    halfFloat = hf.HALF_FLOAT_OES;
    formatRGBA = formatRG = formatR = [gl.RGBA, gl.RGBA];
  }

  // ---------- Shaders ----------
  const VERT = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;
  const HEAD = "precision highp float; precision highp sampler2D; varying vec2 vUv, vL, vR, vT, vB;";
  const FRAG = {
    splat: HEAD + `
      uniform sampler2D uTarget; uniform float aspectRatio, radius; uniform vec3 color; uniform vec2 point;
      void main () {
        vec2 p = vUv - point; p.x *= aspectRatio;
        vec3 s = exp(-dot(p, p) / radius) * color;
        gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0);
      }`,
    advect: HEAD + `
      uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation;
      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
      }`,
    divergence: HEAD + `
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x, R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
        if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }`,
    curl: HEAD + `
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y, R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }`,
    vorticity: HEAD + `
      uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
      void main () {
        float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x, C = texture2D(uCurl, vUv).x;
        vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        f /= length(f) + 0.0001; f *= curl * C; f.y *= -1.0;
        vec2 v = texture2D(uVelocity, vUv).xy + f * dt;
        gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
      }`,
    pressure: HEAD + `
      uniform sampler2D uPressure, uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
        float d = texture2D(uDivergence, vUv).x;
        gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
      }`,
    gradient: HEAD + `
      uniform sampler2D uPressure, uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
        vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
        gl_FragColor = vec4(v, 0.0, 1.0);
      }`,
    fade: HEAD + `
      uniform sampler2D uTexture; uniform float value;
      void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`,
    blur: HEAD + `
      uniform sampler2D uTexture; uniform vec2 dir;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb * 0.227;
        c += (texture2D(uTexture, vUv + dir * 1.385).rgb + texture2D(uTexture, vUv - dir * 1.385).rgb) * 0.316;
        c += (texture2D(uTexture, vUv + dir * 3.231).rgb + texture2D(uTexture, vUv - dir * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c, 1.0);
      }`,
    display: HEAD + `
      uniform sampler2D uTexture, uBloom; uniform vec3 bg, pageBg; uniform vec2 texelSize; uniform float glow;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        // Soft shading from the ink's own gradient gives the marbled, silky look
        float dx = length(texture2D(uTexture, vR).rgb) - length(texture2D(uTexture, vL).rgb);
        float dy = length(texture2D(uTexture, vT).rgb) - length(texture2D(uTexture, vB).rgb);
        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        float shade = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.55, 0.55, 1.0);
        c *= shade;
        // Soft glow around the plumes, like light inside the ink
        c += texture2D(uBloom, vUv).rgb * glow;
        // Gentle tone curve: bright spots roll off instead of clipping
        c = c / (1.0 + c * 0.9);
        vec3 base = mix(pageBg, bg, smoothstep(0.0, 0.22, vUv.y));
        gl_FragColor = vec4(base + c, 1.0);
      }`,
  };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let vs;
  const programs = {};
  try {
    vs = compile(gl.VERTEX_SHADER, VERT);
    for (const k in FRAG) {
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FRAG[k]));
      gl.bindAttribLocation(p, 0, "aPosition");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
      programs[k] = { p, u };
    }
  } catch (e) {
    return null;
  }

  // Full-screen quad
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  // ---------- Framebuffers ----------
  function fbo(w, h, fmt, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt[0], w, h, 0, fmt[1], halfFloat, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      tex, fbo: fb, w, h, tx: 1 / w, ty: 1 / h,
      bind(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; },
    };
  }
  function double(w, h, fmt, filter) {
    let a = fbo(w, h, fmt, filter), b = fbo(w, h, fmt, filter);
    return { get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; }, w, h, tx: 1 / w, ty: 1 / h };
  }
  function res(r) {
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const lo = Math.round(r), hi = Math.round(r * (aspect < 1 ? 1 / aspect : aspect));
    return aspect > 1 ? { w: hi, h: lo } : { w: lo, h: hi };
  }

  let dye, velocity, divergence, curlTex, pressure, bloomA, bloomB;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, o.lite ? 1 : 1.5);
    const w = Math.max(2, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h && dye) return false;
    canvas.width = w; canvas.height = h;
    return true;
  }
  function initTargets() {
    const s = res(o.simRes), d = res(o.dyeRes);
    const L = gl.LINEAR;
    dye = double(d.w, d.h, formatRGBA, L);
    velocity = double(s.w, s.h, formatRG, L);
    divergence = fbo(s.w, s.h, formatR, gl.NEAREST);
    curlTex = fbo(s.w, s.h, formatR, gl.NEAREST);
    pressure = double(s.w, s.h, formatR, gl.NEAREST);
    const b = res(o.dyeRes / 4);
    bloomA = fbo(b.w, b.h, formatRGBA, L);
    bloomB = fbo(b.w, b.h, formatRGBA, L);
  }
  try { sizeCanvas(); initTargets(); } catch (e) { return null; }

  function use(name) { const pr = programs[name]; gl.useProgram(pr.p); return pr.u; }

  // ---------- Simulation ----------
  function step(dt) {
    gl.disable(gl.BLEND);
    let u = use("curl");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uVelocity, velocity.read.bind(0));
    blit(curlTex);

    u = use("vorticity");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uVelocity, velocity.read.bind(0));
    gl.uniform1i(u.uCurl, curlTex.bind(1));
    gl.uniform1f(u.curl, o.curl);
    gl.uniform1f(u.dt, dt);
    blit(velocity.write); velocity.swap();

    u = use("divergence");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uVelocity, velocity.read.bind(0));
    blit(divergence);

    u = use("fade");
    gl.uniform1i(u.uTexture, pressure.read.bind(0));
    gl.uniform1f(u.value, o.pressure);
    blit(pressure.write); pressure.swap();

    u = use("pressure");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uDivergence, divergence.bind(0));
    for (let i = 0; i < o.pressureIters; i++) {
      gl.uniform1i(u.uPressure, pressure.read.bind(1));
      blit(pressure.write); pressure.swap();
    }

    u = use("gradient");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uPressure, pressure.read.bind(0));
    gl.uniform1i(u.uVelocity, velocity.read.bind(1));
    blit(velocity.write); velocity.swap();

    u = use("advect");
    gl.uniform2f(u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(u.uVelocity, velocity.read.bind(0));
    gl.uniform1i(u.uSource, velocity.read.bind(0));
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, o.velFade);
    blit(velocity.write); velocity.swap();

    gl.uniform1i(u.uVelocity, velocity.read.bind(0));
    gl.uniform1i(u.uSource, dye.read.bind(1));
    gl.uniform1f(u.dissipation, o.dyeFade);
    blit(dye.write); dye.swap();
  }

  function render() {
    // Glow: blur a small copy of the ink, twice for a wide, soft halo
    let u = use("blur");
    gl.uniform2f(u.texelSize, bloomA.tx, bloomA.ty);
    let src = dye.read;
    for (let i = 0; i < 2; i++) {
      gl.uniform1i(u.uTexture, src.bind(0));
      gl.uniform2f(u.dir, bloomA.tx * (1 + i), 0);
      blit(bloomA);
      gl.uniform1i(u.uTexture, bloomA.bind(0));
      gl.uniform2f(u.dir, 0, bloomA.ty * (1 + i));
      blit(bloomB);
      src = bloomB;
    }

    u = use("display");
    gl.uniform2f(u.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(u.uTexture, dye.read.bind(0));
    gl.uniform1i(u.uBloom, bloomB.bind(1));
    gl.uniform1f(u.glow, o.glow);
    gl.uniform3fv(u.bg, o.bg);
    gl.uniform3fv(u.pageBg, o.pageBg);
    blit(null);
  }

  function splatRaw(x, y, dx, dy, color) {
    const aspect = canvas.width / canvas.height;
    let u = use("splat");
    gl.uniform1i(u.uTarget, velocity.read.bind(0));
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0);
    const r = (o.radius / 100) * (aspect > 1 ? aspect : 1);
    gl.uniform1f(u.radius, r);
    blit(velocity.write); velocity.swap();

    gl.uniform1i(u.uTarget, dye.read.bind(0));
    gl.uniform3f(u.color, color[0], color[1], color[2]);
    blit(dye.write); dye.swap();
  }

  // Colour travels slowly along the logo gradient while you move
  let hue = Math.random() * o.palette.length;
  function nextColor(stepSize = 0.07) {
    hue = (hue + stepSize) % o.palette.length;
    const i = Math.floor(hue), f = hue - i;
    const a = o.palette[i], b = o.palette[(i + 1) % o.palette.length];
    const k = o.bright / 255;
    return [0, 1, 2].map((j) => (a[j] + (b[j] - a[j]) * f) * k);
  }

  // ---------- Pointer smoothing ----------
  // The ink follows an eased copy of the pointer and is laid down every frame in
  // small steps, so strokes come out as smooth curves instead of dotted jumps.
  const ptr = { tx: 0, ty: 0, x: 0, y: 0, on: false };
  function flow(dt) {
    if (!ptr.on) return false;
    const k = 1 - Math.pow(1e-7, dt);                   // about 22% of the way each frame at 60fps
    const nx = ptr.x + (ptr.tx - ptr.x) * k, ny = ptr.y + (ptr.ty - ptr.y) * k;
    const dx = nx - ptr.x, dy = ny - ptr.y, dist = Math.hypot(dx, dy);
    if (dist < 0.25) return false;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const n = Math.min(10, Math.max(1, Math.ceil(dist / 6)));
    for (let i = 1; i <= n; i++) {
      const px = ptr.x + (dx * i) / n, py = ptr.y + (dy * i) / n;
      const c = nextColor(0.07 / n).map((v) => v / Math.sqrt(n));
      splatRaw(px / w, 1 - py / h, ((dx / n) / w) * o.force * 1.6, ((-dy / n) / h) * o.force * 1.6, c);
    }
    ptr.x = nx; ptr.y = ny;
    return true;
  }

  // ---------- Loop ----------
  let running = false, visible = true, lastT = 0, lastInput = -1e9;
  const IDLE = 3.2; // seconds after the last movement before the loop stops
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.033, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    if (sizeCanvas()) { try { initTargets(); } catch (e) { running = false; return; } }
    if (flow(dt)) lastInput = now;
    step(dt);
    render();
    if (!visible || now - lastInput > IDLE * 1000) { running = false; lastT = 0; return; }
    requestAnimationFrame(frame);
  }
  function wake() {
    lastInput = performance.now();
    if (running || !visible) return;
    running = true;
    requestAnimationFrame(frame);
  }

  render();

  return {
    // x, y in CSS pixels relative to the canvas
    move(x, y) {
      if (!ptr.on) { ptr.x = x; ptr.y = y; ptr.on = true; }
      ptr.tx = x; ptr.ty = y;
      wake();
    },
    leave() { ptr.on = false; },
    burst(x, y) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.random();
        const c = nextColor().map((v) => v * 1.4);
        splatRaw(x / w, 1 - y / h, Math.cos(a) * 900, Math.sin(a) * 900, c);
      }
      wake();
    },
    setVisible(v) { visible = v; if (!v) running = false; },
    resize() { if (sizeCanvas()) { try { initTargets(); } catch (e) { /* keep old */ } } render(); },
  };
};

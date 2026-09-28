/* ==========================================================
   Rafaq Tec — hero centerpiece
   A cloud of particles that keeps rebuilding itself into what we make:
   a website, a phone app, a neural network, a data chart and a design
   curve. Each shape dissolves and flows into the next; the cursor pushes
   the particles aside like a hand through sand.
   ========================================================== */
window.RafaqMorph = function (canvas, label, opts) {
  "use strict";
  const o = Object.assign({ lite: false, reduce: false }, opts || {});
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const root = document.documentElement;
  const N = o.lite ? 560 : 1150;
  const HOLD = 2.8, MORPH = 1.6; // seconds

  // ---------- Shape building ----------
  // Each shape is a list of strokes; points are spread along them by length.
  const seg = (a, b) => [a, b];
  function poly(pts, close) { const out = []; for (let i = 0; i < pts.length - (close ? 0 : 1); i++) out.push(seg(pts[i], pts[(i + 1) % pts.length])); return out; }
  function rect(x0, y0, x1, y1) { return poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true); }
  function roundRect(x0, y0, x1, y1, r) {
    const out = [], k = 8;
    const arc = (cx, cy, a0) => { const p = []; for (let i = 0; i <= k; i++) { const a = a0 + (i / k) * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
    const pts = [].concat(arc(x1 - r, y0 + r, -Math.PI / 2), arc(x1 - r, y1 - r, 0), arc(x0 + r, y1 - r, Math.PI / 2), arc(x0 + r, y0 + r, Math.PI));
    return out.concat(poly(pts, true));
  }
  function circle(cx, cy, r, k = 24) { const p = []; for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return poly(p, true); }
  function bezier(p0, p1, p2, p3, k = 30) {
    const p = [];
    for (let i = 0; i <= k; i++) {
      const t = i / k, u = 1 - t;
      p.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return poly(p, false);
  }

  const SHAPES = {
    web: [].concat(
      roundRect(-0.92, -0.66, 0.92, 0.66, 0.08),
      poly([[-0.92, -0.44], [0.92, -0.44]]),
      circle(-0.8, -0.55, 0.03, 8), circle(-0.7, -0.55, 0.03, 8), circle(-0.6, -0.55, 0.03, 8),
      roundRect(-0.35, -0.6, 0.55, -0.5, 0.04),
      rect(-0.78, -0.32, 0.1, -0.02), poly([[0.24, -0.3], [0.78, -0.3]]), poly([[0.24, -0.2], [0.7, -0.2]]), poly([[0.24, -0.1], [0.6, -0.1]]),
      roundRect(-0.78, 0.12, -0.3, 0.52, 0.04), roundRect(-0.24, 0.12, 0.24, 0.52, 0.04), roundRect(0.3, 0.12, 0.78, 0.52, 0.04)
    ),
    mobile: [].concat(
      roundRect(-0.44, -0.9, 0.44, 0.9, 0.14),
      roundRect(-0.12, -0.83, 0.12, -0.77, 0.03),
      circle(0, -0.3, 0.24, 30), circle(0, -0.3, 0.14, 20),
      poly([[-0.3, 0.1], [0.3, 0.1]]), poly([[-0.3, 0.22], [0.15, 0.22]]),
      roundRect(-0.3, 0.38, 0.3, 0.5, 0.06), roundRect(-0.3, 0.58, 0.3, 0.7, 0.06),
      poly([[-0.1, 0.83], [0.1, 0.83]])
    ),
    ai: (() => {
      const layers = [[-0.78, 3], [-0.26, 5], [0.26, 5], [0.78, 2]], nodes = [], s = [];
      layers.forEach(([x, n]) => { const col = []; for (let i = 0; i < n; i++) col.push([x, (i - (n - 1) / 2) * 0.34]); nodes.push(col); });
      for (let l = 0; l < nodes.length - 1; l++) nodes[l].forEach((a) => nodes[l + 1].forEach((b) => s.push(seg(a, b))));
      nodes.flat().forEach(([x, y]) => s.push(...circle(x, y, 0.075, 12), ...circle(x, y, 0.075, 12)));
      return s;
    })(),
    data: [].concat(
      poly([[-0.85, -0.75], [-0.85, 0.7], [0.88, 0.7]]),
      rect(-0.7, 0.25, -0.46, 0.7), rect(-0.36, 0.0, -0.12, 0.7), rect(-0.02, 0.15, 0.22, 0.7), rect(0.32, -0.25, 0.56, 0.7), rect(0.66, -0.45, 0.8, 0.7),
      bezier([-0.75, 0.05], [-0.35, -0.45], [0.1, 0.1], [0.78, -0.72], 40),
      circle(-0.75, 0.05, 0.05, 10), circle(0.78, -0.72, 0.05, 10), circle(0.02, -0.18, 0.05, 10)
    ),
    design: [].concat(
      roundRect(-0.9, -0.62, 0.35, 0.72, 0.03),
      bezier([-0.72, 0.4], [-0.55, -0.55], [0.05, 0.55], [0.2, -0.35], 44),
      poly([[-0.72, 0.4], [-0.9, -0.05]]), poly([[0.2, -0.35], [0.42, -0.7]]),
      rect(-0.76, 0.36, -0.68, 0.44), rect(0.16, -0.39, 0.24, -0.31),
      circle(-0.9, -0.05, 0.035, 8), circle(0.42, -0.7, 0.035, 8),
      poly([[0.48, 0.05], [0.48, 0.55], [0.6, 0.43], [0.7, 0.66], [0.78, 0.62], [0.68, 0.4], [0.84, 0.38]], true)
    ),
  };
  const ORDER = ["web", "mobile", "ai", "data", "design"];
  const LABELS = {
    web: ["Web platforms", "منصات ويب"],
    mobile: ["Mobile apps", "تطبيقات موبايل"],
    ai: ["AI & agents", "ذكاء اصطناعي ووكلاء"],
    data: ["Data science", "علم البيانات"],
    design: ["UI/UX design", "تصميم UI/UX"],
  };

  function sample(strokes) {
    const lens = strokes.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
    const total = lens.reduce((x, y) => x + y, 0);
    const pts = [];
    let acc = 0, si = 0;
    for (let i = 0; i < N; i++) {
      const d = ((i + Math.random() * 0.8) / N) * total;
      while (si < strokes.length - 1 && acc + lens[si] < d) { acc += lens[si]; si++; }
      const [a, b] = strokes[si], t = lens[si] ? (d - acc) / lens[si] : 0;
      pts.push([a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * 0.012, a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.18]);
    }
    // Shuffle so particles travel across the whole shape when morphing
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts;
  }
  const TARGETS = ORDER.map((k) => sample(SHAPES[k]));

  // ---------- Particles ----------
  const P = TARGETS[0].map((p, i) => ({ x: p[0], y: p[1], z: p[2], fx: p[0], fy: p[1], fz: p[2], ox: 0, oy: 0, seed: Math.random() * 100, lag: Math.random() * 0.35 }));

  // ---------- Colours ----------
  const DARK = [[84, 239, 228], [9, 221, 236], [1, 108, 240]];
  const LIGHT = [[6, 163, 179], [1, 108, 240], [1, 65, 136]];
  let colors = [];
  function buildColors() {
    const pal = root.getAttribute("data-theme") === "light" ? LIGHT : DARK;
    colors = Array.from({ length: 32 }, (_, n) => {
      const t = (n / 31) * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(t)), f = t - i;
      const a = pal[i], b = pal[i + 1];
      return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
    });
  }
  buildColors();
  addEventListener("rafaq:theme", buildColors);

  // ---------- Size & input ----------
  let W = 1, H = 1, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, o.lite ? 1.5 : 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(2, Math.round(W * dpr)); canvas.height = Math.max(2, Math.round(H * dpr));
  }
  const mouse = { x: -1e4, y: -1e4 };
  addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1e4; });

  // ---------- Label ----------
  let shown = -1;
  function setLabel(i) {
    if (!label) return;
    shown = i;
    const key = ORDER[i], ar = root.lang === "ar";
    label.classList.remove("is-in");
    void label.offsetWidth;
    label.querySelector(".mc-num").textContent = String(i + 1).padStart(2, "0");
    label.querySelector(".mc-name").textContent = LABELS[key][ar ? 1 : 0];
    label.classList.add("is-in");
  }
  new MutationObserver(() => { if (shown >= 0) setLabel(shown); }).observe(root, { attributes: true, attributeFilter: ["lang"] });

  // ---------- Loop ----------
  let cur = 0, phaseStart = 0, morphing = false, running = true, visible = true, last = 0;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (o.lite && now - last < 30) return;
    last = now;
    const t = now / 1000;
    if (!phaseStart) phaseStart = t;
    let p = t - phaseStart;

    if (!morphing && p > HOLD && !o.reduce) {
      // Start flowing into the next shape
      P.forEach((q) => { q.fx = q.x; q.fy = q.y; q.fz = q.z; });
      cur = (cur + 1) % ORDER.length;
      morphing = true; phaseStart = t; p = 0;
      setLabel(cur);
    }
    const tgt = TARGETS[cur];
    const rotY = Math.sin(t * 0.45) * 0.38, rotX = Math.sin(t * 0.31) * 0.14;
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const S = Math.min(W, H) * 0.42, ox = W / 2, oy = H / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const light = root.getAttribute("data-theme") === "light";
    ctx.globalCompositeOperation = light ? "source-over" : "lighter";

    for (let i = 0; i < P.length; i++) {
      const q = P[i], g = tgt[i];
      if (morphing) {
        // Each particle leaves at its own moment and swirls a little on the way
        const k = ease(Math.min(1, Math.max(0, (p - q.lag) / (MORPH - 0.35))));
        const swirl = Math.sin(k * Math.PI) * 0.35;
        q.x = q.fx + (g[0] - q.fx) * k + Math.sin(q.seed + k * 6) * swirl;
        q.y = q.fy + (g[1] - q.fy) * k + Math.cos(q.seed * 1.3 + k * 6) * swirl;
        q.z = q.fz + (g[2] - q.fz) * k;
      } else {
        q.x = g[0] + Math.sin(t * 1.3 + q.seed) * 0.006;
        q.y = g[1] + Math.cos(t * 1.1 + q.seed) * 0.006;
        q.z = g[2];
      }
      // Slow 3D sway and perspective
      const x1 = q.x * cy + q.z * sy, z1 = -q.x * sy + q.z * cy;
      const y1 = q.y * cx - z1 * sx, z2 = q.y * sx + z1 * cx;
      const persp = 2.6 / (2.6 + z2);
      let px = ox + x1 * S * persp, py = oy + y1 * S * persp;
      // Cursor pushes particles aside, and they drift back
      const dx = px + q.ox - mouse.x, dy = py + q.oy - mouse.y, d2 = dx * dx + dy * dy, R = 90;
      if (d2 < R * R) { const f = (1 - Math.sqrt(d2) / R) * 6; const d = Math.sqrt(d2) || 1; q.ox += (dx / d) * f; q.oy += (dy / d) * f; }
      q.ox *= 0.9; q.oy *= 0.9;
      px += q.ox; py += q.oy;
      const size = (o.lite ? 1.6 : 1.35) * persp;
      ctx.globalAlpha = light ? 0.85 : 0.8;
      ctx.fillStyle = colors[Math.max(0, Math.min(31, ((q.x + 1) / 2) * 31 | 0))];
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (morphing && p > MORPH) { morphing = false; phaseStart = t; }
  }

  resize();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  setLabel(0);

  const sync = () => {
    const was = running;
    running = visible && !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  requestAnimationFrame(frame);
  return {};
};

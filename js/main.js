/* ==========================================================
   Rafaq Tec — interactions & motion
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const hasGSAP = !!window.gsap;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const I18N = window.RAFAQ_I18N || { ar: {}, en: {}, agent: { en: [], ar: [] } };

  // Lite mode: phones, weak CPUs, low memory or data-saver get lighter effects
  const conn = navigator.connection || {};
  let lite =
    !finePointer ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (navigator.deviceMemory || 8) <= 4 ||
    !!conn.saveData ||
    /(^|-)2g/.test(conn.effectiveType || "");
  if (lite) root.classList.add("lite");

  // Failsafe: never leave the page hidden if a script or CDN fails
  const revealAll = () => {
    root.classList.remove("js");
    const pre = $("#preloader");
    if (pre) pre.remove();
    body.classList.remove("loading");
  };
  window.addEventListener("error", (e) => { if (!e.filename || /main\.js|gsap|ScrollTrigger|lenis/i.test(e.filename)) revealAll(); });
  setTimeout(() => { if ($("#preloader")) revealAll(); }, 6000);

  if (hasGSAP && !reduce) root.classList.add("js");
  if (finePointer && !reduce && !lite) root.classList.add("has-cursor");
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Language ---------------- */
  const i18nNodes = $$("[data-i18n]");
  i18nNodes.forEach((n) => (n.dataset.en = n.innerHTML));
  let lang = "en";
  try { lang = localStorage.getItem("rafaq-lang") || "en"; } catch (e) {}

  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;

  function applyLang(next, animate) {
    lang = next;
    root.lang = next;
    root.dir = next === "ar" ? "rtl" : "ltr";
    i18nNodes.forEach((n) => {
      const ar = I18N.ar[n.dataset.i18n];
      n.innerHTML = next === "ar" && ar ? ar : n.dataset.en;
    });
    document.title = next === "ar" ? "رفاق تك — أقوى معًا" : "Rafaq Tec — Stronger Together";
    try { localStorage.setItem("rafaq-lang", next); } catch (e) {}
    if (animate && hasGSAP && !reduce) {
      gsap.fromTo("main, .nav-links, .footer", { opacity: 0.2 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
    }
    if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
    agent.restart();
    quiz.refresh();
  }

  $("#lang-toggle").addEventListener("click", () => applyLang(lang === "en" ? "ar" : "en", true));

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (window.Lenis && !reduce && !lite) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis && lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { if (lenis) { lenis.raf(time); requestAnimationFrame(raf); } };
      requestAnimationFrame(raf);
    }
  }

  function goTo(target, id) {
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: id === "#home" ? 0 : -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      goTo(target, id);
    });
  });

  /* ---------------- Nav, menu & progress ---------------- */
  const nav = $("#nav");
  const progress = $("#scroll-progress");
  let lastY = 0;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hidden", y > 500 && y > lastY + 2 && !root.classList.contains("menu-open"));
    if (y < lastY - 2) nav.classList.remove("hidden");
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    ticking = false;
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.inert = !open;
  }
  function closeMenu() { setMenu(false); }
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("menu-open")) closeMenu();
  });

  /* ---------------- Custom cursor ---------------- */
  if (root.classList.contains("has-cursor")) {
    const cur = $("#cursor");
    const dot = $("#cursor-dot");
    const label = $("#cursor-label");
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    (function loop() {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const hover = e.target.closest("a, button, [data-tilt], .chips label, input, textarea");
      cur.classList.toggle("is-label", !!labelled);
      cur.classList.toggle("is-hover", !labelled && !!hover);
      if (labelled) label.textContent = t("cursor.view");
    });
    document.addEventListener("mouseleave", () => { cur.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener("mouseenter", () => { cur.style.opacity = 1; dot.style.opacity = 1; });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (hasGSAP && finePointer && !reduce && !lite) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: x * 0.3, y: y * 0.4, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "power4.out" }));
    });
  }

  /* ---------------- Spotlight + tilt cards ---------------- */
  $$("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--x", `${px * 100}%`);
      card.style.setProperty("--y", `${py * 100}%`);
      if (hasGSAP && !reduce && !lite) {
        gsap.to(card, { rotateY: (px - 0.5) * 10, rotateX: (0.5 - py) * 10, transformPerspective: 900, duration: 0.6, ease: "power3.out" });
      }
    });
    card.addEventListener("mouseleave", () => {
      if (hasGSAP && !reduce && !lite) gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "power3.out" });
    });
  });

  /* ---------------- Hero particle field ---------------- */
  function heroCanvas() {
    const canvas = $("#hero-canvas");
    const ctx = canvas.getContext("2d");
    const hero = $(".hero");
    const palette = [[45, 212, 191], [34, 211, 238], [56, 189, 248], [59, 130, 246], [29, 78, 216]];
    let w = 0, h = 0, pts = [], running = true, lastW = 0, last = 0;
    const mouse = { x: -9999, y: -9999 };

    // Pre-built colour strings (no string building inside the frame loop)
    const BUCKETS = 24;
    const colors = Array.from({ length: BUCKETS }, (_, n) => {
      const tt = (n / (BUCKETS - 1)) * (palette.length - 1);
      const i = Math.floor(tt), f = tt - i;
      const a = palette[i], b = palette[Math.min(i + 1, palette.length - 1)];
      return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
    });
    const colorAt = (x) => colors[Math.max(0, Math.min(BUCKETS - 1, ((x / w) * (BUCKETS - 1)) | 0))];

    function spawn() {
      const n = lite ? Math.min(36, Math.floor((w * h) / 30000)) : Math.min(90, Math.floor((w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    }
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, lite ? 1 : 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile browsers fire resize when the address bar hides: only respawn on real width changes
      if (Math.abs(w - lastW) > 80 || !pts.length) { spawn(); lastW = w; }
    }

    // Measure real performance once; drop to lite mode if the device struggles
    let probeFrames = 0, probeStart = 0;
    function probe(now) {
      if (lite || probeFrames < 0) return;
      if (!probeStart) probeStart = now;
      if (++probeFrames === 60) {
        const fps = 60000 / (now - probeStart);
        probeFrames = -1;
        if (fps < 40) {
          lite = true;
          root.classList.add("lite");
          if (lenis) { lenis.destroy(); lenis = null; }
          resize(); spawn();
        }
      }
    }

    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      probe(now);
      if (lite && now - last < 33) return; // ~30fps is plenty on weak devices
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          const f = (1 - d2 / 22000) * 0.6;
          p.vx += (dx / Math.sqrt(d2 + 1)) * f;
          p.vy += (dy / Math.sqrt(d2 + 1)) * f;
        }
        p.vx *= 0.97; p.vy *= 0.97;
        p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      ctx.lineWidth = 0.8;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const c = colorAt(a.x);
        ctx.strokeStyle = c;
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 15000) {
            ctx.globalAlpha = (1 - d2 / 15000) * 0.28;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const mx = a.x - mouse.x, my = a.y - mouse.y;
        const md = mx * mx + my * my;
        if (md < 40000) {
          ctx.globalAlpha = (1 - md / 40000) * 0.5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = c;
        ctx.fillRect(a.x - a.r, a.y - a.r, a.r * 2, a.r * 2);
      }
      ctx.globalAlpha = 1;
    }
    hero.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
    let resizeTimer;
    addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    resize();
    // Only animate while the hero is on screen and the tab is visible
    let inView = true;
    const sync = () => {
      const was = running;
      running = inView && !document.hidden;
      if (running && !was) requestAnimationFrame(frame);
    };
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(hero);
    document.addEventListener("visibilitychange", sync);
    requestAnimationFrame(frame);
  }
  if (!reduce) heroCanvas();

  /* ---------------- AI agent demo ---------------- */
  const agent = (() => {
    const box = $("#term-body");
    const typing = $("#term-typing");
    let run = 0;
    let started = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function add(type, text) {
      const el = document.createElement("div");
      el.className = `msg ${type}`;
      if (text) el.textContent = text;
      box.appendChild(el);
      while (box.children.length > 8) box.firstElementChild.remove();
      return el;
    }

    async function play() {
      const me = ++run;
      const alive = () => me === run;
      box.innerHTML = "";
      typing.textContent = "";
      const script = I18N.agent[lang] || I18N.agent.en;
      for (const step of script) {
        if (!alive()) return;
        if (step.type === "user") {
          for (const ch of step.text) {
            typing.textContent += ch;
            await sleep(reduce ? 0 : 26);
            if (!alive()) return;
          }
          await sleep(350);
          typing.textContent = "";
          add("user", step.text);
          await sleep(600);
        } else if (step.type === "tool") {
          const el = add("tool");
          const spin = document.createElement("span");
          spin.className = "spinner";
          const label = document.createElement("span");
          label.textContent = step.text;
          el.append(spin, label);
          await sleep(850);
          if (!alive()) return;
          spin.replaceWith(Object.assign(document.createElement("span"), { textContent: "✓", style: "color:#3ee08f" }));
          el.appendChild(Object.assign(document.createElement("span"), { className: "ok", textContent: step.result }));
          await sleep(250);
        } else {
          const el = add("agent");
          el.innerHTML = '<span class="typing-dots"><i></i><i></i><i></i></span>';
          await sleep(900);
          if (!alive()) return;
          el.textContent = "";
          for (const word of step.text.split(" ")) {
            el.textContent += (el.textContent ? " " : "") + word;
            await sleep(reduce ? 0 : 55);
            if (!alive()) return;
          }
          await sleep(1400);
        }
      }
      await sleep(4500);
      if (alive()) play();
    }

    new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) { started = true; play(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe($("#terminal"));

    return { restart: () => { if (started) play(); } };
  })();

  /* ---------------- Work cards -> contact ---------------- */
  $$(".work-card").forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.querySelector("h3")?.textContent?.trim() || "";
      const msg = $("#f-msg");
      if (msg && !msg.value.trim()) msg.value = t("work.interest").replace("{name}", name);
      goTo($("#contact"), "#contact");
    });
  });

  /* ---------------- Service-fit quiz ---------------- */
  const quiz = (() => {
    const card = $("#quiz-card");
    if (!card) return { refresh() {} };
    const steps = $$(".quiz-step", card);
    const resultEl = $(".quiz-result", card);
    const fill = $("#quiz-progress-fill");
    const answers = {};
    let stepIndex = 0;

    const ICON_UIUX = '<rect x="6" y="8" width="36" height="26" rx="4"/><path d="M6 16h36M16 40h16M24 34v6"/><circle cx="18" cy="25" r="3"/><path d="M26 22h10M26 27h6"/>';
    const ICON_WEB = '<path d="M17 14L7 24l10 10M31 14l10 10-10 10M27 10l-6 28"/>';
    const ICON_MOBILE = '<rect x="13" y="5" width="22" height="38" rx="5"/><path d="M21 10h6M22 37h4"/>';
    const ICON_AI = '<rect x="10" y="14" width="28" height="22" rx="6"/><circle cx="19" cy="25" r="2.5"/><circle cx="29" cy="25" r="2.5"/><path d="M24 14V8M20 8h8M5 22v6M43 22v6M19 31h10"/>';
    const ICON_COMPASS = '<circle cx="24" cy="24" r="18"/><path d="M31 17 21 21l-4 10 10-4 4-10Z"/>';

    const SERVICE = {
      uiux: { key: "svc.1.t", desc: "quiz.result.desc.uiux", icon: ICON_UIUX, chip: "uiux" },
      web: { key: "svc.2.t", desc: "quiz.result.desc.web", icon: ICON_WEB, chip: "web" },
      mobile: { key: "svc.3.t", desc: "quiz.result.desc.mobile", icon: ICON_MOBILE, chip: "mobile" },
      ai: { key: "svc.4.t", desc: "quiz.result.desc.ai", icon: ICON_AI, chip: "ai" },
      unsure: { key: "quiz.result.discoveryTitle", desc: "quiz.result.discoveryDesc", icon: ICON_COMPASS, chip: "uiux" },
    };

    function showStep(i) {
      steps.forEach((s, idx) => (s.hidden = idx !== i));
      resultEl.hidden = i < steps.length;
      fill.style.transform = `scaleX(${Math.min(i, steps.length) / steps.length})`;
    }

    function renderResult() {
      const conf = SERVICE[answers.service ? answers.service.value : "unsure"];
      $("#quiz-result-icon").innerHTML = `<svg viewBox="0 0 48 48">${conf.icon}</svg>`;
      $("#quiz-result-service").textContent = t(conf.key);
      $("#quiz-result-desc").textContent = t(conf.desc);
    }

    $$(".quiz-opt", card).forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".quiz-options");
        $$(".quiz-opt", group).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        answers[group.dataset.q] = { value: btn.dataset.value, label: btn.textContent.trim() };
        setTimeout(() => {
          if (stepIndex < steps.length - 1) { stepIndex++; showStep(stepIndex); }
          else { renderResult(); stepIndex = steps.length; showStep(stepIndex); }
        }, 260);
      });
    });

    $$(".quiz-back", card).forEach((btn) => {
      btn.addEventListener("click", () => { if (stepIndex > 0) { stepIndex--; showStep(stepIndex); } });
    });

    $("#quiz-restart").addEventListener("click", () => {
      answers.service = answers.timeline = answers.budget = null;
      $$(".quiz-opt", card).forEach((b) => b.classList.remove("is-active"));
      stepIndex = 0;
      showStep(0);
    });

    $("#quiz-cta").addEventListener("click", () => {
      const conf = SERVICE[answers.service ? answers.service.value : "unsure"];
      const chip = $(`.chips input[value="${conf.chip}"]`);
      if (chip) chip.checked = true;
      const msg = $("#f-msg");
      if (msg && !msg.value.trim()) {
        msg.value = t("quiz.summary")
          .replace("{service}", t(conf.key))
          .replace("{timeline}", answers.timeline ? answers.timeline.label : "—")
          .replace("{budget}", answers.budget ? answers.budget.label : "—");
      }
      goTo($("#contact"), "#contact");
    });

    showStep(0);
    return { refresh: () => { if (!resultEl.hidden) renderResult(); } };
  })();

  /* ---------------- Contact form ---------------- */
  const form = $("#contact-form");
  const note = $("#form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    ["f-name", "f-email", "f-msg"].forEach((id) => {
      const input = $("#" + id);
      const valid = input.value.trim() && (input.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
      input.parentElement.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    note.classList.toggle("err", !ok);
    note.textContent = ok ? t("ct.ok") : t("ct.err");
    if (ok) {
      // TODO: send the form data to your backend / email service here.
      form.reset();
      if (hasGSAP && !reduce) gsap.fromTo(note, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
    }
  });

  /* ---------------- Counters (fallback without GSAP) ---------------- */
  function setCounters() { $$(".count").forEach((c) => (c.textContent = c.dataset.to)); }

  /* ---------------- Motion ---------------- */
  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero-title .line > span", { yPercent: 115, rotate: 3, duration: 1.4, stagger: 0.12 })
      .to(".intro-fade", { opacity: 1, duration: 1.2, stagger: 0.12 }, 0.35)
      .from(".intro-fade", { y: 26, duration: 1.2, stagger: 0.12 }, 0.35)
      .from(".hero-visual", { scale: 0.5, opacity: 0, rotate: -25, duration: 1.8 }, 0)
      .from(".float-chip", { opacity: 0, duration: 0.8, stagger: 0.1 }, 0.8)
      .from(".nav", { opacity: 0, duration: 1 }, 0.2);
  }

  function scrollMotion() {
    // Logo mark: a gentle breathing scale
    gsap.to("#hero-mark", { scale: 1.035, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });

    // 3D tilt of the logo following the mouse
    const mark = $("#hero-mark");
    $(".hero").addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      gsap.to(mark, { rotateY: nx * 30, rotateX: -ny * 30, x: nx * 20, y: ny * 20, transformPerspective: 800, duration: 1, ease: "power3.out" });
      gsap.to(".float-chip", { x: nx * -30, y: ny * -30, duration: 1.2, ease: "power3.out", stagger: 0.02 });
    });

    // Hero parallax out
    gsap.to(".hero-copy", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-visual", { yPercent: 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Marquee skews with scroll velocity
    if (lenis) {
      const skew = gsap.quickTo(".marquee-track", "skewX", { duration: 0.5, ease: "power3.out" });
      lenis.on("scroll", (e) => skew(gsap.utils.clamp(-12, 12, e.velocity * -0.6)));
    }

    // Generic reveals
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, overwrite: "auto" }),
    });

    // Counters
    $$(".count").forEach((el) => {
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(obj, { v: +el.dataset.to, duration: 2.2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v)) }),
      });
    });

    // Process: horizontal scroll on desktop, stacked reveal on mobile
    const mm = gsap.matchMedia();
    const track = $("#process-track");
    const fill = $("#process-fill");
    mm.add("(min-width: 961px)", () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: "#process", start: "top top", end: () => "+=" + dist(),
          pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => (fill.style.transform = `scaleX(${self.progress})`),
        },
      });
      gsap.from(".step", { opacity: 0, y: 60, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: "#process", start: "top 70%" } });
    });
    mm.add("(max-width: 960px)", () => {
      $$(".step").forEach((s) => gsap.from(s, { opacity: 0, y: 60, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%" } }));
    });

    // Work visuals zoom in as they enter
    $$(".work-visual").forEach((v) => {
      gsap.fromTo(v, { clipPath: "inset(12% 12% 12% 12% round 26px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 26px)", ease: "none",
        scrollTrigger: { trigger: v, start: "top 95%", end: "top 45%", scrub: true },
      });
    });

    // Contact title glow drift
    gsap.fromTo(".contact-glow", { yPercent: 30, scale: 0.8 }, { yPercent: 0, scale: 1.1, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom bottom", scrub: true } });

    // Footer giant wordmark rises
    gsap.from(".footer-giant span", { yPercent: 50, opacity: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  /* ---------------- Preloader ---------------- */
  function preloader(done) {
    const pre = $("#preloader");
    if (!hasGSAP || reduce) { pre.remove(); done(); return; }
    body.classList.add("loading");
    if (lenis) lenis.stop();
    const num = $("#pre-num");
    const counter = { v: 0 };
    gsap.set(".pre-mark", { scale: 0.6, y: -30, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(".pre-word span", { yPercent: 110 });

    const tl = gsap.timeline();
    tl.timeScale(lite ? 2.2 : 1.5); // keep the intro short so nobody waits
    tl
      .to(".pre-mark", { scale: 1, y: 0, opacity: 1, duration: 1.3, ease: "expo.out" })
      .to(counter, { v: 100, duration: 1.7, ease: "power2.inOut", onUpdate: () => (num.textContent = Math.round(counter.v)) }, 0)
      .to(".pre-word span", { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0.55)
      .to(".pre-mark", { scale: 1.2, duration: 0.25, ease: "power2.in" }, 1.55)
      .to(".pre-mark", { scale: 1, duration: 0.5, ease: "power3.out" })
      .to(".pre-curtain", { scaleY: 1, duration: 0.8, ease: "expo.inOut" }, "-=.35")
      .add(() => {
        gsap.set([".pre-mark", ".pre-word", ".pre-count"], { opacity: 0 });
        pre.style.background = "transparent";
        done();
      })
      .set(".pre-curtain", { transformOrigin: "50% 0%" })
      .to(".pre-curtain", { scaleY: 0, duration: 0.9, ease: "expo.inOut" })
      .add(() => {
        pre.remove();
        body.classList.remove("loading");
        if (lenis) lenis.start();
      });
  }

  /* ---------------- Boot ---------------- */
  if (lang !== "en") applyLang(lang, false);

  const start = () => {
    preloader(() => {
      if (hasGSAP && !reduce) {
        heroIntro();
        scrollMotion();
        ScrollTrigger.refresh();
      } else {
        setCounters();
      }
    });
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(start);
  } else {
    start();
  }
})();

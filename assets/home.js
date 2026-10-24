/* UltraTrain 2.0 home: scroll storytelling and interactions.
   Progressive: everything below enhances markup that already renders in its final state.
   Motion (pins, scrubs, smooth scroll) only runs when GSAP loaded AND the user allows motion.
   Interactions (calculator, presets, plan demo, picker, share) always run. */
(function () {
  "use strict";

  const doc = document;
  const html = doc.documentElement;
  const lang = html.lang === "fr" ? "fr" : "en";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && !reduce;
  const R = window.UTRank;
  const T = {
    en: {
      tiers: { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", diamond: "Diamond", champion: "Champion", ultralegend: "Ultra Legend" },
      eqKm: "equivalent km", formula: (km, d, eq) => `${fmt(km)} km + ${fmt(d)} m / 100 = ${fmt(eq)} equivalent km`,
      backyard: (loops, eq) => `${loops} loops at 6.7 km, about ${fmt(eq)} km. The tier comes from the app's backyard scale, not from kilometres.`,
      noteRace: "Equivalent km = distance + climb / 100. Race tiers have no divisions.",
      noteBackyard: "Backyard ultras are scored on loops completed, because the pace is imposed. On that scale a backyard is never Bronze.",
      raceTier: "Race tier", shareTitle: "My race tier on UltraTrain", shareText: (name, tier) => `${name}: a ${tier} race on UltraTrain's scale. Find your own rank at ultratrain.app`,
      sharing: "Preparing your story image...", shared: "Shared.", downloaded: "Image saved. Share it to your story.", shareFail: "Could not create the image on this browser.",
      loops: "loops", raceLabel: (km, d) => `${fmt(km)} km, ${fmt(d)} m D+`, findRank: "Find your own rank at ultratrain.app", weeks: "weeks", week: "week"
    },
    fr: {
      tiers: { bronze: "Bronze", silver: "Argent", gold: "Or", platinum: "Platine", diamond: "Diamant", champion: "Champion", ultralegend: "Ultra Légende" },
      eqKm: "km équivalents", formula: (km, d, eq) => `${fmt(km)} km + ${fmt(d)} m / 100 = ${fmt(eq)} km équivalents`,
      backyard: (loops, eq) => `${loops} boucles de 6,7 km, environ ${fmt(eq)} km. Le tier vient de l'échelle backyard de l'app, pas des kilomètres.`,
      noteRace: "Km équivalents = distance + D+ / 100. Les tiers de course n'ont pas de divisions.",
      noteBackyard: "Les backyards sont notées sur les boucles bouclées, parce que l'allure est imposée. Sur cette échelle, une backyard n'est jamais Bronze.",
      raceTier: "Tier de course", shareTitle: "Mon tier de course sur UltraTrain", shareText: (name, tier) => `${name} : une course ${tier} sur l'échelle UltraTrain. Trouve ton rang sur ultratrain.app`,
      sharing: "Préparation de ton image de story...", shared: "Partagé.", downloaded: "Image enregistrée. Partage-la dans ta story.", shareFail: "Impossible de créer l'image sur ce navigateur.",
      loops: "boucles", raceLabel: (km, d) => `${fmt(km)} km, ${fmt(d)} m D+`, findRank: "Trouve ton rang sur ultratrain.app", weeks: "semaines", week: "semaine"
    }
  }[lang];
  const PAL = { bronze: ["#F7C9A0", "#C8814A"], silver: ["#FFFFFF", "#B9C3D0"], gold: ["#FFF0BE", "#E2B84E"], platinum: ["#E2FFFB", "#6ED3C6"], diamond: ["#E3F1FF", "#5AA9FF"], champion: ["#FFD3D7", "#E8364A"], ultralegend: ["#7FDFFF", "#7A5CFF"] };

  function fmt(n) {
    const v = Math.round(n * 10) / 10;
    const s = (Number.isInteger(v) ? v : v.toFixed(1)).toString();
    const parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return lang === "fr" ? parts.join(",") : parts.join(".");
  }
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let lenis = null;
  if (motion) {
    html.classList.add("js-motion");
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && window.matchMedia("(pointer: fine)").matches) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  function scrollToHash(hash) {
    const target = hash && hash.length > 1 ? doc.querySelector(hash) : null;
    if (!target) return false;
    if (lenis) { lenis.scrollTo(target, { offset: -84 }); return true; }
    return false;
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { if (scrollToHash(a.getAttribute("href"))) e.preventDefault(); }));

  // Count-up helper (works with or without GSAP)
  function tweenNumber(el, from, to, duration, format) {
    format = format || fmt;
    if (reduce || !hasGSAP) { el.textContent = format(to); return; }
    const o = { v: from };
    gsap.to(o, { v: to, duration: duration || 0.8, ease: "power3.out", onUpdate: () => { el.textContent = format(o.v); }, onComplete: () => { el.textContent = format(to); } });
  }

  /* ---------- 1. Hero: pinned phone, four screens ---------- */
  (function hero() {
    const stage = $("[data-hero]");
    if (!stage) return;
    const screens = $$(".hero-phone .screen", stage);
    const dots = $$(".hero-dots button", stage);
    const lineEl = $("[data-hero-line]", stage);
    const lines = lineEl ? JSON.parse(lineEl.getAttribute("data-lines")) : [];
    let current = 0;
    function show(i) {
      i = clamp(i, 0, screens.length - 1);
      if (i === current && screens[i].classList.contains("is-active")) return;
      current = i;
      screens.forEach((s, k) => s.classList.toggle("is-active", k === i));
      dots.forEach((d, k) => { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      if (lineEl && lines[i]) lineEl.textContent = lines[i];
    }
    let userTouched = false;
    dots.forEach((d) => d.addEventListener("click", () => { userTouched = true; show(Number(d.getAttribute("data-goto"))); }));
    if (motion) {
      const st = ScrollTrigger.create({
        trigger: stage, start: "top 76px", end: "+=220%", pin: true, scrub: true, anticipatePin: 1,
        onUpdate: (self) => show(Math.min(screens.length - 1, Math.floor(self.progress * screens.length * 0.999)))
      });
      const small = window.innerWidth < 760;
      $$("[data-parallax]", stage).forEach((el) => {
        if (small && el.classList.contains("float-chip")) return; // chips sit above the phone on small screens
        const f = (parseFloat(el.getAttribute("data-parallax")) || 0) * (small ? 0.4 : 1);
        gsap.to(el, { y: f * 160, ease: "none", scrollTrigger: { trigger: stage, start: "top 76px", end: "+=220%", scrub: 0.6 } });
      });
      gsap.fromTo($(".hero-phone", stage), { y: 10, scale: 0.98 }, { y: -10, scale: 1, ease: "none", scrollTrigger: { trigger: stage, start: "top 76px", end: "+=220%", scrub: 0.6 } });
      stage.setAttribute("data-pinned", "true");
      void st;
    } else if (!reduce) {
      // No GSAP: cycle the screens slowly until the visitor picks one.
      const timer = setInterval(() => { if (userTouched) { clearInterval(timer); return; } show((current + 1) % screens.length); }, 3500);
    }
  })();

  /* ---------- 3. Calculator ---------- */
  (function calculator() {
    const form = $("[data-calc]");
    const result = $("[data-result]");
    if (!form || !result || !R) return;
    const fields = $(".calc-fields", form);
    const kmIn = $("#calc-km"), dIn = $("#calc-dplus"), loopsIn = $("#calc-loops");
    const chips = $$("[data-race]", form);
    const note = $("[data-note]", form);
    const eqEl = $("[data-eq]", result), formulaEl = $("[data-formula]", result);
    const ladder = $$(".ladder-mini li", result);
    const badgeBox = $("[data-badge]", result), reveal = $("[data-reveal-badge]", result);
    const badgeImgs = $$("picture", badgeBox);
    const tierName = $("[data-tier-name]", result);
    const lineEl = $("[data-tier-line]", result);
    const lines = JSON.parse(lineEl.getAttribute("data-lines"));
    const particles = $(".particles", result);
    const state = { mode: "race", km: 50, dplus: 1500, loops: 24, name: "A local 50K", tier: "gold", eq: 65 };

    function burst(tier) {
      if (reduce) return;
      particles.innerHTML = "";
      const colors = PAL[tier];
      for (let i = 0; i < 26; i++) {
        const p = doc.createElement("i");
        const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
        p.style.setProperty("--dx", `${Math.cos(a) * d}px`);
        p.style.setProperty("--dy", `${Math.sin(a) * d - 40}px`);
        p.style.setProperty("--rot", `${Math.round(Math.random() * 540 - 270)}deg`);
        p.style.setProperty("--c", i % 3 === 0 ? colors[0] : colors[1]);
        p.style.animationDelay = `${Math.random() * 120}ms`;
        particles.appendChild(p);
        requestAnimationFrame(() => p.classList.add("go"));
      }
      setTimeout(() => { particles.innerHTML = ""; }, 1400);
    }

    function setTier(tier, animate) {
      const changed = tier !== state.tier || !badgeBox.classList.contains("ready");
      state.tier = tier;
      result.setAttribute("data-tier", tier);
      badgeBox.setAttribute("data-tier", tier);
      badgeImgs.forEach((img) => img.classList.toggle("is-active", img.getAttribute("data-tier") === tier));
      tierName.textContent = T.tiers[tier];
      lineEl.textContent = lines[tier];
      const idx = R.TIERS.indexOf(tier);
      ladder.forEach((li, i) => { li.classList.toggle("lit", i <= idx); li.classList.toggle("now", i === idx); });
      if (changed && animate) {
        reveal.classList.remove("pop"); void reveal.offsetWidth; reveal.classList.add("pop");
        burst(tier);
      }
      badgeBox.classList.add("ready");
    }

    function compute(animate) {
      const r = R.raceTier(state.mode === "backyard" ? { backyard: true, loops: state.loops } : { distanceKm: state.km, elevationGainM: state.dplus });
      const prev = state.eq;
      state.eq = r.equivalentKm;
      tweenNumber(eqEl, prev, r.equivalentKm, 0.7);
      formulaEl.textContent = r.backyard ? T.backyard(r.loops, r.equivalentKm) : T.formula(state.km, state.dplus, r.equivalentKm);
      note.textContent = r.backyard ? T.noteBackyard : T.noteRace;
      setTier(r.tier, animate);
    }

    function syncRanges() {
      $$("input[type=range]", form).forEach((rg) => { const src = $("#" + rg.getAttribute("data-mirror")); if (src) rg.value = clamp(Number(src.value), Number(rg.min), Number(rg.max)); });
    }
    function readInputs() {
      state.km = clamp(Number(kmIn.value) || 0, 0, 1000);
      state.dplus = clamp(Number(dIn.value) || 0, 0, 50000);
      state.loops = clamp(Math.round(Number(loopsIn.value) || 0), 0, 200);
    }
    function clearChips() { chips.forEach((c) => c.setAttribute("aria-pressed", "false")); state.name = null; }

    [kmIn, dIn, loopsIn].forEach((inp) => inp.addEventListener("input", () => { clearChips(); readInputs(); syncRanges(); compute(true); }));
    $$("input[type=range]", form).forEach((rg) => rg.addEventListener("input", () => {
      const src = $("#" + rg.getAttribute("data-mirror")); src.value = rg.value; clearChips(); readInputs(); compute(true);
    }));
    $$("[data-step]", form).forEach((b) => b.addEventListener("click", () => {
      loopsIn.value = clamp((Number(loopsIn.value) || 0) + Number(b.getAttribute("data-step")), 1, 200); clearChips(); readInputs(); syncRanges(); compute(true);
    }));
    chips.forEach((chip) => chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
      state.name = chip.getAttribute("data-name");
      if (chip.hasAttribute("data-backyard")) {
        state.mode = "backyard"; fields.setAttribute("data-mode", "backyard");
        loopsIn.value = chip.getAttribute("data-loops") || 24;
      } else {
        state.mode = "race"; fields.setAttribute("data-mode", "race");
        kmIn.value = chip.getAttribute("data-km"); dIn.value = chip.getAttribute("data-dplus");
      }
      readInputs(); syncRanges(); compute(true);
    }));
    readInputs(); syncRanges(); compute(false);
    // First reveal when the result scrolls into view
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { setTier(state.tier, false); reveal.classList.add("pop"); burst(state.tier); io.disconnect(); } }); }, { threshold: 0.5 });
      io.observe(reveal);
    }

    /* Share my race tier: 1080x1920 story image on a canvas, Web Share with download fallback */
    const shareBtn = $("[data-share-tier]", result), status = $("[data-share-status]", result);
    if (!shareBtn) return;
    if (!("HTMLCanvasElement" in window)) { shareBtn.hidden = true; return; }
    function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
    function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function displayFont(px) { return `800 ${px}px "SF Pro Display", -apple-system, "Barlow Condensed", system-ui, sans-serif`; }
    async function renderStory() {
      const tier = state.tier, [ml, mm] = PAL[tier];
      try { await doc.fonts.load('800 100px "Barlow Condensed"'); await doc.fonts.load('600 40px "DM Sans"'); } catch (e) { /* system fonts will do */ }
      const badgeSrc = `${lang === "fr" ? "../" : ""}assets/img/badges/rank-${tier}-960.png`;
      const storeSrc = `${lang === "fr" ? "../" : ""}assets/img/app-store-badge-${lang}.svg`;
      const [badge, store] = await Promise.all([loadImage(badgeSrc), loadImage(storeSrc).catch(() => null)]);
      const W = 1080, H = 1920, c = doc.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      if ("fontStretch" in ctx) ctx.fontStretch = "condensed";
      ctx.fillStyle = "#070D1A"; ctx.fillRect(0, 0, W, H);
      const g1 = ctx.createRadialGradient(140, 160, 0, 140, 160, 760); g1.addColorStop(0, "rgba(46,197,255,.40)"); g1.addColorStop(1, "rgba(46,197,255,0)"); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(980, 1800, 0, 980, 1800, 820); g2.addColorStop(0, "rgba(255,77,90,.34)"); g2.addColorStop(1, "rgba(255,77,90,0)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      const g3 = ctx.createRadialGradient(900, 300, 0, 900, 300, 640); g3.addColorStop(0, "rgba(122,92,255,.30)"); g3.addColorStop(1, "rgba(122,92,255,0)"); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.07)"; for (let y = 24; y < H; y += 44) for (let x = 24; x < W; x += 44) ctx.fillRect(x, y, 3, 3);
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#2EC5FF"; ctx.font = displayFont(38); ctx.letterSpacing = "10px"; ctx.fillText("ULTRATRAIN", W / 2, 190);
      ctx.fillStyle = "#93A3BC"; ctx.font = '600 34px "DM Sans", system-ui, sans-serif'; ctx.letterSpacing = "6px"; ctx.fillText(T.raceTier.toUpperCase(), W / 2, 330);
      // Badge with the in-app glow
      const size = 620, bx = (W - size) / 2, by = 390;
      if (tier !== "bronze" && tier !== "silver") {
        ctx.save(); ctx.filter = "blur(90px)"; ctx.globalAlpha = tier === "ultralegend" ? 0.5 : 0.45;
        if (tier === "ultralegend") { ctx.fillStyle = "#2EC5FF"; ctx.beginPath(); ctx.arc(W / 2 - 40, by + size / 2, size * 0.34, 0, 7); ctx.fill(); ctx.fillStyle = "#FF4D5A"; ctx.beginPath(); ctx.arc(W / 2 + 40, by + size / 2, size * 0.34, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = mm; ctx.beginPath(); ctx.arc(W / 2, by + size / 2, size * 0.37, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 70; ctx.shadowOffsetY = 20; ctx.drawImage(badge, bx, by, size, size); ctx.restore();
      ctx.letterSpacing = "8px";
      const tg = ctx.createLinearGradient(0, 1080, 0, 1200); tg.addColorStop(0, ml); tg.addColorStop(1, mm);
      ctx.fillStyle = tg; ctx.font = displayFont(tier === "ultralegend" ? 136 : 170); ctx.fillText(T.tiers[tier].toUpperCase(), W / 2, 1190);
      ctx.letterSpacing = "0px";
      const raceName = state.name || (state.mode === "backyard" ? `${state.loops} ${T.loops}` : T.raceLabel(state.km, state.dplus));
      ctx.fillStyle = "#F4F7FB"; ctx.font = '700 52px "DM Sans", system-ui, sans-serif'; ctx.fillText(raceName, W / 2, 1300);
      const detail = state.mode === "backyard" ? `${state.loops} ${T.loops}` : (state.name ? T.raceLabel(state.km, state.dplus) : "");
      ctx.fillStyle = "#93A3BC"; ctx.font = '500 38px "DM Sans", system-ui, sans-serif'; if (detail) ctx.fillText(detail, W / 2, 1362);
      roundRect(ctx, 240, 1420, 600, 150, 32); ctx.fillStyle = "rgba(15,27,48,.9)"; ctx.fill(); ctx.strokeStyle = "#2A3D60"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#2EC5FF"; ctx.font = displayFont(84); ctx.fillText(fmt(state.eq), W / 2, 1512);
      ctx.fillStyle = "#93A3BC"; ctx.font = '600 26px "DM Sans", system-ui, sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText(T.eqKm.toUpperCase(), W / 2, 1552); ctx.letterSpacing = "0px";
      ctx.fillStyle = "#F4F7FB"; ctx.font = '600 36px "DM Sans", system-ui, sans-serif'; ctx.fillText(T.findRank, W / 2, 1690);
      if (store) { const sw = 300, sh = sw * store.height / store.width; ctx.drawImage(store, (W - sw) / 2, 1730, sw, sh); }
      return new Promise((res) => c.toBlob(res, "image/png"));
    }
    shareBtn.addEventListener("click", async () => {
      status.textContent = T.sharing; shareBtn.disabled = true;
      try {
        const blob = await renderStory();
        if (!blob) throw new Error("no blob");
        const file = new File([blob], "ultratrain-race-tier.png", { type: "image/png" });
        const text = T.shareText(state.name || (state.mode === "backyard" ? `${state.loops} ${T.loops}` : T.raceLabel(state.km, state.dplus)), T.tiers[state.tier]);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: T.shareTitle, text });
          status.textContent = T.shared;
        } else {
          const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; doc.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          status.textContent = T.downloaded;
        }
      } catch (err) {
        status.textContent = err && err.name === "AbortError" ? "" : T.shareFail;
      } finally { shareBtn.disabled = false; }
    });
  })();

  /* ---------- 4. Curtain: the band slides over the pinned calculator ---------- */
  (function curtain() {
    const calc = $(".calc"), band = $("[data-band]");
    if (!motion || !calc || !band || window.innerWidth < 900) return;
    ScrollTrigger.create({
      trigger: calc, start: "bottom bottom", end: () => "+=" + band.offsetHeight, pin: true, pinSpacing: false,
      onToggle: (self) => calc.classList.toggle("is-pinned", self.isActive)
    });
  })();

  /* ---------- 5. Ladder: pinned horizontal climb ---------- */
  (function ladder() {
    const sec = $("[data-ladder]");
    if (!sec || !motion) return;
    const pin = $(".ladder-pin", sec), track = $(".ladder-track", sec), rungs = $$("[data-rung]", sec), bar = $("[data-ladder-bar]", sec);
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 2 * parseFloat(getComputedStyle(track).paddingLeft));
    function paint(p) {
      if (bar) bar.style.transform = `scaleX(${1 + p * 6})`;
      const pos = p * (rungs.length - 1);
      rungs.forEach((r, i) => {
        const pips = $$("[data-pips] i", r);
        if (pips.length === 1) { pips[0].classList.toggle("on", pos >= i - 0.5); return; }
        const local = clamp(pos - i + 0.6, 0, 1.2);
        const lit = local <= 0 ? 0 : local < 0.4 ? 1 : local < 0.8 ? 2 : 3;
        pips.forEach((pip, k) => pip.classList.toggle("on", k < lit));
      });
    }
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: pin, start: "center center", end: () => "+=" + dist() * 1.1, pin: true, scrub: 0.4, invalidateOnRefresh: true, onUpdate: (s) => paint(s.progress) }
    });
    paint(0);
  })();

  /* ---------- 6. Player card presets ---------- */
  (function playerCard() {
    const wrap = $("[data-hex]");
    if (!wrap) return;
    const area = $("[data-area]", wrap), dots = $$(".dot", wrap), vals = $$("[data-val]", wrap), ovr = $("[data-ovr]", wrap);
    const cx = 200, cy = 200, r = 150;
    let current = (wrap.getAttribute("data-values") || "").split(",").map(Number);
    function paint(v) {
      const pts = v.map((val, i) => { const a = -Math.PI / 2 + i * Math.PI / 3, d = r * val / 100; return [cx + d * Math.cos(a), cy + d * Math.sin(a)]; });
      area.setAttribute("points", pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
      dots.forEach((dot, i) => { dot.setAttribute("cx", pts[i][0].toFixed(1)); dot.setAttribute("cy", pts[i][1].toFixed(1)); });
      vals.forEach((t, i) => { t.textContent = Math.round(v[i]); });
      ovr.textContent = Math.round(v.reduce((a, b) => a + b, 0) / v.length);
      const tmpl = wrap.getAttribute("data-label"); if (tmpl) wrap.setAttribute("aria-label", tmpl.replace(/\{(\d)\}/g, (m, k) => Math.round(v[Number(k)])));
    }
    function morph(target) {
      if (reduce || !hasGSAP) { current = target.slice(); paint(current); return; }
      const o = {}; current.forEach((v, i) => { o["v" + i] = v; });
      const to = {}; target.forEach((v, i) => { to["v" + i] = v; });
      gsap.to(o, Object.assign(to, { duration: 0.9, ease: "power3.inOut", onUpdate: () => paint(current.map((_, i) => o["v" + i])), onComplete: () => { current = target.slice(); paint(current); } }));
    }
    $$("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      $$("[data-preset]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      morph(b.getAttribute("data-preset").split(",").map(Number));
    }));
    paint(current);
    if (motion) gsap.from(area, { scale: 0.1, transformOrigin: "200px 200px", opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: wrap, start: "top 80%", once: true } });
  })();

  /* ---------- 7. How it works: the sticky phone follows the step in view ---------- */
  (function how() {
    const grid = $("[data-how]");
    if (!grid || !("IntersectionObserver" in window)) return;
    const screens = $$(".how-aside .screen", grid);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { const i = Number(e.target.getAttribute("data-step")); screens.forEach((s, k) => s.classList.toggle("is-active", k === i)); } });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    $$("[data-step]", grid).forEach((s) => io.observe(s));
  })();

  /* ---------- 8. Plan demo ---------- */
  (function plan() {
    const root = $("[data-plan]");
    if (!root || !R) return;
    const dateIn = $("[data-plan-date]", root), levelIn = $("[data-plan-level]", root), weeksEl = $("[data-plan-weeks]", root), list = $("[data-plan-weeks-list]", root);
    const lineEl = $("[data-plan-line]", root), lines = JSON.parse(lineEl.getAttribute("data-lines"));
    const state = { eq: 160, level: "intermediate", weeks: 20, skip: "none" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const def = new Date(today.getTime() + 20 * 7 * 86400000);
    dateIn.value = def.toISOString().slice(0, 10);
    dateIn.min = new Date(today.getTime() + 4 * 7 * 86400000).toISOString().slice(0, 10);
    let firstPaint = true;
    function render() {
      const d = new Date(dateIn.value + "T00:00:00");
      const weeks = isNaN(d) ? 20 : clamp(Math.round((d - today) / (7 * 86400000)), 4, 44);
      state.weeks = weeks; weeksEl.textContent = weeks;
      const bars = R.weekBars(weeks, state.eq, state.level);
      const now = Math.max(0, Math.floor(weeks * 0.35));
      const skip = R.skipDemo(state.skip, state.level);
      list.innerHTML = "";
      bars.forEach((w, i) => {
        const li = doc.createElement("li");
        li.setAttribute("data-phase", w.phase);
        let v = w.volume;
        if (i === now + 1 && skip.nextWeekFactor < 1) { v *= skip.nextWeekFactor; li.classList.add("eased"); }
        if (w.recovery) li.classList.add("recovery");
        if (i === now) li.classList.add("now");
        li.style.setProperty("--v", (firstPaint && !reduce ? 0 : v).toFixed(3));
        li.style.transitionDelay = firstPaint && !reduce ? `${i * 28}ms` : "0ms";
        li.setAttribute("title", `${T.week} ${i + 1}: ${w.phase}`);
        list.appendChild(li);
        if (firstPaint && !reduce) requestAnimationFrame(() => requestAnimationFrame(() => li.style.setProperty("--v", v.toFixed(3))));
      });
      lineEl.textContent = lines[state.skip];
      firstPaint = false;
    }
    $$("[data-plan-race]", root).forEach((b) => b.addEventListener("click", () => {
      $$("[data-plan-race]", root).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      state.eq = Number(b.getAttribute("data-plan-race")); render();
    }));
    $$("[data-skip]", root).forEach((b) => b.addEventListener("click", () => {
      $$("[data-skip]", root).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      state.skip = b.getAttribute("data-skip"); render();
    }));
    dateIn.addEventListener("change", render);
    levelIn.addEventListener("change", () => { state.level = levelIn.value; render(); });
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { render(); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(list);
    } else { render(); }
  })();

  /* ---------- 9. Story picker ---------- */
  (function story() {
    const root = $("[data-story]");
    if (!root) return;
    const phone = $("[data-story-phone]", root), stickers = $$(".story-stickers picture", root), tabs = $$("[data-pick]", root);
    const bars = $$(".story-bar i", root), nameEl = $("[data-sticker-name]", root), descEl = $("[data-sticker-desc]", root);
    let i = 0, auto = null, touched = false;
    function show(n) {
      i = (n + stickers.length) % stickers.length;
      stickers.forEach((s, k) => s.classList.toggle("is-active", k === i));
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
      bars.forEach((b, k) => { b.classList.toggle("done", k < i); b.classList.remove("on"); if (k === i) requestAnimationFrame(() => b.classList.add("on")); });
      nameEl.textContent = tabs[i].getAttribute("data-name"); descEl.textContent = tabs[i].getAttribute("data-desc");
      const t = tabs[i]; if (t.scrollIntoView && touched) t.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
    }
    function stopAuto() { touched = true; if (auto) { clearInterval(auto); auto = null; } }
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => { stopAuto(); show(k); });
      t.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { stopAuto(); show(i + 1); tabs[i].focus(); } if (e.key === "ArrowLeft") { stopAuto(); show(i - 1); tabs[i].focus(); } });
    });
    let sx = null;
    phone.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    phone.addEventListener("pointerup", (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { stopAuto(); show(dx < 0 ? i + 1 : i - 1); } else if (Math.abs(dx) < 6) { stopAuto(); show(i + 1); } });
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((e) => {
        if (e[0].isIntersecting && !touched && !auto) { show(i); auto = setInterval(() => show(i + 1), 3000); }
        else if (!e[0].isIntersecting && auto) { clearInterval(auto); auto = null; }
      }, { threshold: 0.4 });
      io.observe(phone);
    }
  })();

  /* ---------- 11. Comparison flip ---------- */
  (function flip() {
    const stage = $("[data-flip]");
    if (!stage || !motion) return;
    const card = $(".flip-card", stage);
    gsap.fromTo(card, { rotateY: 0 }, { rotateY: 180, ease: "power1.inOut", scrollTrigger: { trigger: stage, start: "top 75%", end: "top 15%", scrub: 0.6 } });
  })();

  /* ---------- Reveals ---------- */
  if (motion) {
    $$("[data-reveal]").forEach((el) => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
})();

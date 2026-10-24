/* UltraTrain website: nav, reveals, count-ups, typed bubbles, hexagon. No dependencies. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.getAttribute("data-open") === "true";
      menu.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.setAttribute("data-open", "false"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { menu.setAttribute("data-open", "false"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  // Scroll reveals
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Count-ups: <span data-count="29">29</span>
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce || isNaN(target)) { el.textContent = el.getAttribute("data-count") + suffix; return; }
    var start = null, duration = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Typed speech bubbles: <span data-type="text">text</span>
  function typeBubble(el) {
    var text = el.getAttribute("data-type") || el.textContent;
    var bubble = el.closest(".bubble");
    if (reduce) { el.textContent = text; if (bubble) bubble.classList.add("done"); return; }
    el.textContent = "";
    var i = 0;
    function step() {
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) { setTimeout(step, 22); } else if (bubble) { bubble.classList.add("done"); }
    }
    step();
  }

  function onceVisible(selector, fn, threshold) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { fn(entry.target); o.unobserve(entry.target); }
      });
    }, { threshold: threshold || 0.4 });
    els.forEach(function (el) { o.observe(el); });
  }
  onceVisible("[data-count]", countUp, 0.5);
  onceVisible("[data-type]", typeBubble, 0.6);

  // Hexagon player card: <div class="hex-wrap" data-values="82,74,66,79,71,88">
  var hex = document.querySelector(".hex-wrap");
  if (hex) {
    var values = (hex.getAttribute("data-values") || "").split(",").map(Number);
    var cx = 200, cy = 200, r = 150;
    var pts = values.map(function (v, i) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      var d = r * v / 100;
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    });
    var area = hex.querySelector(".area");
    if (area) area.setAttribute("points", pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
    var dots = hex.querySelectorAll(".dot");
    dots.forEach(function (dot, i) { if (pts[i]) { dot.setAttribute("cx", pts[i][0].toFixed(1)); dot.setAttribute("cy", pts[i][1].toFixed(1)); } });
    onceVisible(".hex-wrap", function (el) {
      el.classList.add("in");
      el.querySelectorAll("[data-count]").forEach(countUp);
    }, 0.5);
  }
})();

/* ==========================================================================
   Chef Melvin — Motion layer
   Adds scroll reveals, hero intro, parallax, tilt/magnetic hover, recipe and
   Cook Mode transitions, and a slider "hint" sweep.

   Load AFTER gsap.min.js, deck-gallery.js and main.js.
   Needs only GSAP core (no ScrollTrigger) — scroll work uses
   IntersectionObserver + one rAF-throttled scroll listener.
   Respects prefers-reduced-motion: if set, this file does nothing and every
   element stays visible exactly as authored.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof gsap === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;
  root.classList.add("motion-ready");

  /* ───────────── helpers ───────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // Split an element's text into word (and optionally char) spans.
  // The original text is kept on aria-label so screen readers read it normally.
  function split(el, withChars) {
    var text = el.textContent.replace(/\s+/g, " ").trim();
    var words = [], chars = [];
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split(" ").forEach(function (w, wi, all) {
      var ws = document.createElement("span");
      ws.className = "split-word";
      ws.setAttribute("aria-hidden", "true");
      if (withChars) {
        w.split("").forEach(function (ch) {
          var cs = document.createElement("span");
          cs.className = "split-char";
          cs.textContent = ch;
          ws.appendChild(cs);
          chars.push(cs);
        });
      } else {
        ws.textContent = w;
      }
      el.appendChild(ws);
      words.push(ws);
      if (wi < all.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return { words: words, chars: chars };
  }

  function observeOnce(el, threshold, cb, margin) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); }
      });
    }, { threshold: threshold, rootMargin: margin === undefined ? "0px 0px -8% 0px" : margin });
    io.observe(el);
  }

  // Hide a set of elements, then animate them in (staggered) as they scroll into view.
  // Elements that enter the viewport in the same tick are staggered together.
  function reveal(selector, o) {
    o = o || {};
    var els = qsa(selector);
    if (!els.length) return;
    gsap.set(els, { opacity: 0, x: o.x || 0, y: o.y === undefined ? 36 : o.y, scale: o.scale || 1 });
    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      visible.forEach(function (e, i) {
        io.unobserve(e.target);
        gsap.to(e.target, {
          opacity: 1, x: 0, y: 0, scale: 1,
          duration: o.duration || 0.9,
          delay: i * (o.stagger === undefined ? 0.12 : o.stagger),
          ease: o.ease || "power3.out",
          // hand transform/opacity back to CSS so hover effects keep working
          onComplete: function () { gsap.set(e.target, { clearProps: "transform,opacity" }); }
        });
      });
    }, { threshold: o.threshold || 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ───────────── 1. scroll progress bar ───────────── */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var setProgress = gsap.quickSetter(bar, "scaleX");

  /* ───────────── 2. hero intro ───────────── */
  var hero = qs(".hero");
  var heroMedia = qs(".hero-media");
  var heroContent = qs(".hero-content");
  var h1 = qs(".hero-content h1");

  if (hero && h1) {
    var parts = split(h1, true);
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".site-header .logo, .site-header .main-nav a, .site-header .header-actions",
        { y: -18, opacity: 0, duration: 0.7, stagger: 0.07, clearProps: "transform,opacity" }, 0)
      .from(parts.chars,
        { yPercent: 120, rotate: 6, opacity: 0, duration: 1, stagger: 0.05, ease: "power4.out" }, 0.2)
      .from(".hero-tagline", { y: 30, opacity: 0, duration: 0.9, clearProps: "transform,opacity" }, 0.9)
      .from(".hero-sub", { y: 30, opacity: 0, duration: 0.9, clearProps: "transform,opacity" }, 1.05)
      .from(".hero-cta .btn",
        { y: 26, opacity: 0, duration: 0.8, stagger: 0.12, clearProps: "transform,opacity" }, 1.2)
      .from(".scroll-cue", { opacity: 0, duration: 0.8 }, 1.8);
  }
  if (heroMedia) {
    // slow settle-in zoom; rests at 1.12 so parallax never exposes an edge
    gsap.fromTo(heroMedia, { scale: 1.24 }, { scale: 1.12, duration: 3, ease: "power2.out" });
  }

  /* ───────────── 3. scroll handler: progress, parallax, smart header ───────────── */
  var header = qs(".site-header");
  var nav = qs("#mainNav");
  var setMediaY = heroMedia ? gsap.quickSetter(heroMedia, "y", "px") : null;
  var setContentY = heroContent ? gsap.quickSetter(heroContent, "y", "px") : null;
  var setContentO = heroContent ? gsap.quickSetter(heroContent, "opacity") : null;

  var lastY = window.scrollY, downAcc = 0, upAcc = 0;
  var headerHidden = false, lockUntil = 0, ticking = false;

  function showHeader() {
    if (!header || !headerHidden) return;
    headerHidden = false;
    gsap.to(header, { yPercent: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
  }
  function hideHeader() {
    if (!header || headerHidden) return;
    headerHidden = true;
    gsap.to(header, { yPercent: -100, duration: 0.45, ease: "power3.inOut", overwrite: "auto" });
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    setProgress(max > 0 ? y / max : 0);

    if (hero) {
      var hh = hero.offsetHeight;
      if (y < hh * 1.2) {
        if (setMediaY) setMediaY(Math.min(y * 0.1, hh * 0.05));
        if (setContentY) setContentY(y * 0.18);
        if (setContentO) setContentO(Math.max(0, 1 - y / (hh * 0.75)));
      }
    }

    var delta = y - lastY;
    if (delta > 0) { downAcc += delta; upAcc = 0; } else { upAcc -= delta; downAcc = 0; }
    lastY = y;

    var navOpen = nav && nav.classList.contains("is-open");
    if (Date.now() > lockUntil && !navOpen) {
      if (downAcc > 40 && y > 300) hideHeader();
      else if (upAcc > 20 || y <= 300) showHeader();
    } else if (y <= 300) {
      showHeader();
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  // clicking an in-page link keeps the header visible while the page scrolls there
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) { lockUntil = Date.now() + 1400; showHeader(); }
  });
  onScroll();

  /* ───────────── 4. scroll reveals ───────────── */
  reveal(".section .eyebrow", { y: 20, duration: 0.7 });
  reveal(".section h2", { y: 44 });
  reveal(".section-lede", { y: 28, stagger: 0 });
  reveal(".about-copy > p, .pull-quote, .journey-heading", { y: 28, stagger: 0.1 });
  reveal(".journey-item", { x: -34, y: 0, stagger: 0.16, duration: 0.8 });
  reveal(".service-card", { y: 56, scale: 0.96, stagger: 0.12 });
  reveal(".dish-list-heading", { y: 24 });
  reveal(".dish-list li", { x: -26, y: 0, stagger: 0.1, duration: 0.7 });
  // y only (no scale) so deck-gallery.js slot maths and the slider hit-testing stay exact
  reveal(".deck-gallery", { y: 60, duration: 1.1, threshold: 0.08 });
  reveal(".compare", { y: 50, duration: 1, threshold: 0.2 });
  reveal(".recipe-card", { y: 50, duration: 1, threshold: 0.1 });
  reveal(".cta-band-inner > *", { y: 34, stagger: 0.15 });
  reveal(".contact-direct, .contact-form .form-row, .contact-form .btn", { y: 26, stagger: 0.09, duration: 0.7 });
  reveal(".footer-inner > *, .footer-bottom", { y: 24, stagger: 0.12, duration: 0.8 });

  /* about photo: curtain wipe + de-zoom */
  var aboutMedia = qs(".about-media");
  if (aboutMedia) {
    var aboutImg = qs("img", aboutMedia);
    gsap.set(aboutMedia, { clipPath: "inset(0 0 100% 0)" });
    if (aboutImg) gsap.set(aboutImg, { scale: 1.3 });
    observeOnce(aboutMedia, 0.15, function () {
      gsap.to(aboutMedia, {
        clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "power4.inOut",
        onComplete: function () { gsap.set(aboutMedia, { clearProps: "clipPath" }); }
      });
      if (aboutImg) gsap.to(aboutImg, { scale: 1, duration: 1.8, ease: "power3.out" });
    });
  }

  /* testimonial: words light up one by one */
  var quote = qs(".testimonial-quote");
  if (quote) {
    var q = split(quote, false);
    gsap.set(q.words, { opacity: 0.12, y: 14 });
    observeOnce(quote, 0.4, function () {
      gsap.to(q.words, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power2.out" });
    });
  }

  /* ───────────── 5. hover physics (mouse only) ───────────── */
  if (CAN_HOVER) {
    // magnetic buttons
    qsa(".btn").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4 - 2);
      });
      btn.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });

    // 3D tilt on service cards
    qsa(".service-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: px * 10, rotationX: -py * 10, y: -6, transformPerspective: 800,
          duration: 0.4, ease: "power2.out", overwrite: "auto"
        });
      });
      card.addEventListener("pointerleave", function () {
        gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.6)", overwrite: "auto" });
      });
    });
  }

  /* ───────────── 6. recipe card ───────────── */
  var list = qs("#ingredientsList");
  if (list) {
    // main.js rebuilds the <li>s on every servings/unit change — animate the new ones
    new MutationObserver(function () {
      var items = qsa("li", list);
      gsap.from(items, { opacity: 0, y: 10, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "transform,opacity" });
      gsap.fromTo(qsa("b", list), { scale: 1.2, transformOrigin: "right center" },
        { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" });
    }).observe(list, { childList: true });
  }
  ["servingsVal", "servingsOut"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(function () {
      gsap.fromTo(el, { scale: 1.35, y: -4 }, { scale: 1, y: 0, duration: 0.45, ease: "back.out(3)", clearProps: "transform" });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ───────────── 7. Cook Mode ───────────── */
  var cook = qs("#cookMode");
  var cookInner = qs(".cook-mode-inner");
  var stepEl = qs("#cookModeStep");
  var progEl = qs("#cookModeProgress");
  var lastStep = null;

  function stepNum() {
    var m = progEl && progEl.textContent.match(/Step (\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  }
  // NOTE: create the "open" observer first so lastStep is reset before the step observer runs
  if (cook && cookInner) {
    new MutationObserver(function () {
      if (cook.hidden) return;
      lastStep = null;
      gsap.fromTo(cook, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(cookInner, { y: 50, scale: 0.95 }, { y: 0, scale: 1, duration: 0.55, ease: "back.out(1.4)" });
    }).observe(cook, { attributes: true, attributeFilter: ["hidden"] });
  }
  if (stepEl) {
    new MutationObserver(function () {
      var n = stepNum();
      var dir = lastStep === null ? 0 : (n > lastStep ? 1 : -1);
      lastStep = n;
      gsap.fromTo(stepEl, { opacity: 0, x: dir * 40, y: dir ? 0 : 20 },
        { opacity: 1, x: 0, y: 0, duration: 0.5, ease: "power3.out" });
    }).observe(stepEl, { childList: true, characterData: true, subtree: true });
  }

  /* ───────────── 8. before/after slider: a hint sweep ───────────── */
  var cmp = qs("#compare");
  var cmpHandle = qs("#compareHandle");
  if (cmp && cmpHandle && window.MFAME && typeof window.MFAME.setComparePosition === "function") {
    observeOnce(cmp, 0.6, function () {
      var p = { v: 50 };
      var apply = function () { window.MFAME.setComparePosition(p.v); };
      var sweep = gsap.timeline({ delay: 0.7 })
        .to(p, { v: 30, duration: 0.9, ease: "power2.inOut", onUpdate: apply })
        .to(p, { v: 70, duration: 1.3, ease: "power2.inOut", onUpdate: apply })
        .to(p, { v: 50, duration: 0.9, ease: "power2.inOut", onUpdate: apply });
      var stop = function () { sweep.kill(); };
      cmp.addEventListener("pointerdown", stop, { once: true });
      cmpHandle.addEventListener("keydown", stop, { once: true });
    }, "0px");
  }
})();

/* ==========================================================================
   Chef Melvin — The Chef's Deck (Portfolio card-game gallery)
   States: DECK (stack) → tap → TABLE (dealt piles) → tap card → STORY.
   Requires: JS/gsap.min.js + JS/Flip.min.js loaded first.
   Content lives in DATA below — add/remove media freely. Every photo needs
   an `alt`; every video needs a `poster`.
   ========================================================================== */
(function () {
  "use strict";

  var gallery = document.getElementById("deckGallery");
  if (!gallery || typeof gsap === "undefined" || typeof Flip === "undefined") return;
  gsap.registerPlugin(Flip);

  /* ═══════════ content ═══════════ */
  var DATA = [
    {
      id: "signature-plates",
      title: "Signature Plates",
      mark: "✦",
      cover: { src: "Assets/04.jpeg", alt: "Assorted sushi rolls finished with sauce artwork" },
      note: "A plate should read like a sentence — subject, verb, and one perfect detail. These are the plates I keep returning to.",
      media: [
        { type: "photo", src: "Assets/04.jpeg", alt: "Assorted sushi rolls finished with sauce artwork" },
        { type: "photo", src: "Assets/01.jpeg", alt: "Cured salmon, sushi rice and avocado platter" },
        { type: "photo", src: "Assets/03.jpeg", alt: "Smoked ribs, grilled steak and sausages off the grill" },
        { type: "video", src: "Assets/23.mp4", poster: "Assets/23-poster.jpg", alt: "Greek salad, tossed and finished" },
        { type: "photo", src: "Assets/05.jpeg", alt: "Charcuterie and cheese board with fruit and crackers" },
        { type: "photo", src: "Assets/25.png", alt: "Fine dining beet and vegetable salad" },
        { type: "photo", src: "Assets/06.jpeg", alt: "A plated dish against the dining room" }
      ]
    },
    {
      id: "buffets-events",
      title: "Buffets & Events",
      mark: "❖",
      cover: { src: "Assets/14.jpeg", alt: "A dressed buffet line with seafood displays" },
      note: "A long line, sixty guests, no second chances. The nights I remember are the ones where the food made strangers talk like old friends.",
      media: [
        { type: "photo", src: "Assets/14.jpeg", alt: "A dressed buffet line with seafood displays" },
        { type: "photo", src: "Assets/11.jpeg", alt: "Salad boards and appetizer glasses on a carving table" },
        { type: "photo", src: "Assets/13.jpeg", alt: "Marinated tiger prawns and hand-rolled sushi service" },
        { type: "video", src: "Assets/24.mp4", poster: "Assets/24-poster.jpg", alt: "Roasted beet salad on the buffet line" },
        { type: "photo", src: "Assets/18.jpeg", alt: "A full canapé and sushi counter in color" },
        { type: "photo", src: "Assets/15.jpeg", alt: "Gourmet cold salad and marinated mussel buffet" },
        { type: "photo", src: "Assets/12.jpeg", alt: "Dessert buffet line under warm light" }
      ]
    },
    {
      id: "patisserie-desserts",
      title: "Pâtisserie & Desserts",
      mark: "✤",
      cover: { src: "Assets/08.jpeg", alt: "Contemporary pâtisserie and dessert display" },
      note: "Dessert is the last sentence of the meal — it should be short, sweet, and impossible to forget.",
      media: [
        { type: "photo", src: "Assets/08.jpeg", alt: "Contemporary pâtisserie and dessert display" },
        { type: "photo", src: "Assets/09.jpeg", alt: "Cakes and chocolate on the dessert station" },
        { type: "photo", src: "Assets/10.jpeg", alt: "Frosted cupcakes on a mirrored display" },
        { type: "photo", src: "Assets/16.jpeg", alt: "Fruit parfait glasses on a rustic wooden tray" },
        { type: "photo", src: "Assets/17.jpeg", alt: "Canapés suspended in glass baubles" }
      ]
    },
    {
      id: "in-the-kitchen",
      title: "In the Kitchen",
      mark: "✽",
      cover: { src: "Assets/In the kitchen.jpeg", alt: "Chef Melvin at his station during service" },
      note: "The dining room gets the applause, but 5 a.m. at the market and the hiss of the first pan — that is where the real cooking happens.",
      media: [
        { type: "photo", src: "Assets/In the kitchen.jpeg", alt: "Chef Melvin at his station during service" },
        { type: "photo", src: "Assets/In the kitchen 01.jpeg", alt: "Chef Melvin, portrait in the kitchen" },
        { type: "photo", src: "Assets/19.jpg", alt: "Mise en place — potatoes, peppers, zucchini and cabbage" },
        { type: "photo", src: "Assets/20.jpeg", alt: "Okra stew simmering in the pot" },
        { type: "photo", src: "Assets/21.jpeg", alt: "Slow-cooked chicken curry in the chafing dish" },
        { type: "photo", src: "Assets/22.jpeg", alt: "Braised chicken with tomatoes and herbs" }
      ]
    }
  ];

  /* ═══════════ setup ═══════════ */
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DECK_SCALE = window.matchMedia("(max-width: 639px)").matches ? 1.3 : 1;

  var slotsBox = gallery.querySelector(".table-slots");
  var hint = document.getElementById("dealHint");
  var shuffleBtn = document.getElementById("shuffleBtn");

  var N = DATA.length;
  var STACK_ROT = [-6, 4, -2, 6, -4, 2].slice(0, N);
  var STACK_X = [-3, 4, -5, 3, 5, -4].slice(0, N);
  var STACK_Y = [2, -3, 4, -2, -4, 3].slice(0, N);
  var TABLE_ROT = [-3, 2, -2, 3, -2, 2].slice(0, N);

  var cards = [];
  var state = "deck"; // deck | dealing | table | story | closing
  var hintDismissed = false;
  var openCard = null;
  var idleTweens = [];
  var slots = [];

  DATA.forEach(function (cat, i) {
    slotsBox.insertAdjacentHTML("beforeend", '<div class="slot"></div>');
    var photos = cat.media.filter(function (m) { return m.type === "photo"; }).length;
    var vids = cat.media.length - photos;
    var cnt = photos + " photo" + (photos !== 1 ? "s" : "") +
      (vids ? " · " + vids + " video" + (vids !== 1 ? "s" : "") : "");
    var el = document.createElement("article");
    el.className = "deck-card";
    el.dataset.id = cat.id;
    el.innerHTML =
      '<div class="card-flipper">' +
        '<button class="face face--front" type="button" aria-label="Open photo gallery — deal the cards">' +
          '<span class="cover"><img src="' + cat.cover.src + '" alt="" draggable="false"' +
            (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + '></span>' +
          '<span class="corner-mark" aria-hidden="true">' + cat.mark + '</span>' +
          '<span class="band"><span class="t">' + cat.title + '</span><span class="c">' + cnt + '</span></span>' +
        '</button>' +
        '<div class="face face--back" role="dialog" aria-label="' + cat.title + '" hidden></div>' +
      '</div>';
    gallery.appendChild(el);
    cards.push({
      el: el, cat: cat, i: i,
      flipper: el.querySelector(".card-flipper"),
      front: el.querySelector(".face--front"),
      back: el.querySelector(".face--back"),
      band: el.querySelector(".band"),
      storyBuilt: false
    });
  });

  function computeSlots() {
    var g = gallery.getBoundingClientRect();
    var cx = g.left + g.width / 2, cy = g.top + g.height / 2;
    slots = Array.prototype.map.call(slotsBox.children, function (s) {
      var r = s.getBoundingClientRect();
      return { x: r.left + r.width / 2 - cx, y: r.top + r.height / 2 - cy };
    });
  }
  function initDeck() {
    cards.forEach(function (c, i) {
      gsap.set(c.el, { xPercent: -50, yPercent: -50, x: STACK_X[i], y: STACK_Y[i],
        rotation: STACK_ROT[i], scale: DECK_SCALE, opacity: 1, zIndex: N - i });
      gsap.set(c.band, { opacity: 0 });
    });
  }
  computeSlots();
  initDeck();

  /* ═══════════ idle breathing + hover fan ═══════════ */
  function stopIdle() { idleTweens.forEach(function (t) { t.kill(); }); idleTweens = []; }
  function startIdle() {
    if (RM) return;
    stopIdle();
    idleTweens = cards.map(function (c, i) {
      return gsap.to(c.el, { y: STACK_Y[i] + 2.5, rotation: STACK_ROT[i] + 1,
        duration: 1.6 + i * 0.35, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.2 });
    });
  }
  startIdle();

  if (CAN_HOVER) {
    gallery.addEventListener("mouseenter", function () {
      if (state !== "deck") return;
      stopIdle();
      cards.forEach(function (c, i) {
        gsap.to(c.el, { rotation: STACK_ROT[i] * 1.8, x: STACK_X[i] * 3, duration: 0.35, ease: "power2.out" });
      });
    });
    gallery.addEventListener("mouseleave", function () {
      if (state !== "deck") return;
      cards.forEach(function (c, i) {
        gsap.to(c.el, { rotation: STACK_ROT[i], x: STACK_X[i], duration: 0.4, ease: "power2.inOut",
          onComplete: i === N - 1 ? startIdle : null });
      });
    });
  }

  /* ═══════════ deal / shuffle ═══════════ */
  function finishDeal() {
    state = "table";
    shuffleBtn.hidden = false;
    cards[0].front.focus({ preventScroll: true });
  }
  function deal() {
    if (state !== "deck") return;
    state = "dealing";
    stopIdle();
    if (!hintDismissed && hint) {
      hintDismissed = true;
      gsap.to(hint, { opacity: 0, duration: 0.3, onComplete: function () { hint.remove(); } });
    }
    cards.forEach(function (c) {
      c.front.setAttribute("aria-label", c.cat.title + " — open this pile");
    });
    if (RM) {
      cards.forEach(function (c, i) {
        gsap.set(c.el, { x: slots[i].x, y: slots[i].y, rotation: TABLE_ROT[i], scale: 1 });
      });
      gsap.to(cards.map(function (c) { return c.band; }), { opacity: 1, duration: 0.2 });
      finishDeal();
      return;
    }
    var tl = gsap.timeline({ onComplete: finishDeal });
    cards.forEach(function (c, k) { // deal from the top of the stack
      var i = c.i, t = k * 0.08;
      tl.to(c.el, { x: slots[i].x, duration: 0.55, ease: "power2.inOut" }, t)
        .to(c.el, { y: slots[i].y, duration: 0.55, ease: "power3.out" }, t)
        .to(c.el, { rotation: TABLE_ROT[i], duration: 0.55, ease: "back.out(1.4)" }, t)
        .to(c.el, { scale: 1.03, duration: 0.45, ease: "power2.out" }, t)
        .to(c.el, { scale: 1, duration: 0.18, ease: "back.out(2)" }, t + 0.55)
        .to(c.band, { opacity: 1, duration: 0.3 }, t + 0.3);
    });
  }
  function shuffle() {
    if (state !== "table") return;
    state = "dealing";
    shuffleBtn.hidden = true;
    pauseAllVideo();
    cards.forEach(function (c) {
      c.front.setAttribute("aria-label", "Open photo gallery — deal the cards");
    });
    if (RM) { initDeck(); state = "deck"; return; }
    var tl = gsap.timeline({ onComplete: function () { state = "deck"; startIdle(); } });
    cards.forEach(function (c, k) {
      var t = k * 0.06;
      tl.to(c.band, { opacity: 0, duration: 0.2 }, t)
        .to(c.el, { x: STACK_X[c.i], y: STACK_Y[c.i], duration: 0.45, ease: "power3.in" }, t)
        .to(c.el, { rotation: STACK_ROT[c.i], duration: 0.3, ease: "back.out(2)" }, t + 0.35)
        .to(c.el, { scale: DECK_SCALE * 1.04, duration: 0.3 }, t + 0.15)
        .to(c.el, { scale: DECK_SCALE, duration: 0.15, ease: "back.out(2)" }, t + 0.5);
    });
  }
  shuffleBtn.addEventListener("click", shuffle);

  /* ═══════════ story build (lazy) ═══════════ */
  function pauseAllVideo(except) {
    gallery.querySelectorAll(".face--back video").forEach(function (v) {
      if (v !== except) v.pause();
    });
  }
  function buildStory(c) {
    if (c.storyBuilt) return;
    c.storyBuilt = true;
    var photos = c.cat.media.filter(function (m) { return m.type === "photo"; }).length;
    var vids = c.cat.media.length - photos;
    var items = c.cat.media.map(function (m) {
      if (m.type === "photo") {
        return '<img src="' + m.src + '" alt="' + m.alt + '" loading="lazy" draggable="false">';
      }
      return '<div class="story-vid">' +
        '<video preload="none" muted playsinline poster="' + m.poster + '" src="' + m.src + '" aria-label="' + m.alt + '"></video>' +
        '<button class="play" type="button" aria-label="Play video: ' + m.alt + '">▶</button>' +
        '<button class="mute" type="button" aria-label="Unmute" hidden>🔇</button>' +
        '</div>';
    }).join("");
    c.back.innerHTML =
      '<div class="story-head">' +
        '<div><h3>' + c.cat.title + '</h3>' +
        '<span class="cnt">' + photos + " photos" + (vids ? " · " + vids + " video" + (vids !== 1 ? "s" : "") : "") + '</span></div>' +
        '<button class="story-close" type="button" aria-label="Return to table">CM<small>return to table</small></button>' +
      '</div>' +
      '<div class="story-strip" tabindex="0" aria-label="' + c.cat.title + ' — photos and videos, scroll sideways"></div>' +
      '<p class="story-note">' + c.cat.note + '</p>';
    c.back.querySelector(".story-strip").innerHTML = items;
    c.back.querySelector(".story-close").addEventListener("click", function () { history.back(); });
    c.back.querySelectorAll(".story-vid").forEach(function (wrap) {
      var video = wrap.querySelector("video");
      var play = wrap.querySelector(".play");
      var mute = wrap.querySelector(".mute");
      play.addEventListener("click", function () {
        pauseAllVideo(video);
        video.play();
        play.hidden = true;
        mute.hidden = false;
      });
      video.addEventListener("click", function () { if (!video.paused) video.pause(); });
      video.addEventListener("pause", function () { play.hidden = false; });
      video.addEventListener("ended", function () { play.hidden = false; });
      mute.addEventListener("click", function () {
        video.muted = !video.muted;
        mute.textContent = video.muted ? "🔇" : "🔊";
        mute.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
      });
    });
  }

  /* ═══════════ open / close story ═══════════ */
  function openStory(c, instant) {
    if (state !== "table") return;
    state = "story";
    openCard = c;
    shuffleBtn.hidden = true;
    buildStory(c);
    c.back.hidden = false;
    c.front.setAttribute("tabindex", "-1");
    c.front.setAttribute("aria-hidden", "true");
    history.pushState({ deck: c.cat.id }, "", "#gallery/" + c.cat.id);

    var others = cards.filter(function (o) { return o !== c; });
    if (RM || instant) {
      others.forEach(function (o) { gsap.set(o.el, { opacity: 0 }); });
      c.el.classList.add("story-open");
      gsap.set(c.el, { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, zIndex: 60 });
      gsap.set(c.flipper, { rotationY: 180 });
      c.back.querySelector(".story-close").focus({ preventScroll: true });
      return;
    }
    others.forEach(function (o) {
      gsap.to(o.el, { x: "+=" + (slots[o.i].x >= 0 ? 260 : -260), opacity: 0, duration: 0.35, ease: "power2.in" });
    });
    var st = Flip.getState(c.el);
    c.el.classList.add("story-open");
    gsap.set(c.el, { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, zIndex: 60 });
    Flip.from(st, { duration: 0.6, ease: "power2.inOut" });
    gsap.to(c.flipper, { rotationY: 180, duration: 0.6, ease: "power2.inOut",
      onComplete: function () { c.back.querySelector(".story-close").focus({ preventScroll: true }); } });
  }

  function closeStory() {
    var c = openCard;
    if (!c || state !== "story") return;
    state = "closing";
    pauseAllVideo();
    var finish = function () {
      c.back.hidden = true;
      state = "table";
      shuffleBtn.hidden = false;
      c.front.removeAttribute("tabindex");
      c.front.removeAttribute("aria-hidden");
      c.front.focus({ preventScroll: true });
      openCard = null;
    };
    var others = cards.filter(function (o) { return o !== c; });
    if (RM) {
      c.el.classList.remove("story-open");
      gsap.set(c.el, { xPercent: -50, yPercent: -50, x: slots[c.i].x, y: slots[c.i].y,
        rotation: TABLE_ROT[c.i], zIndex: N - c.i });
      gsap.set(c.flipper, { rotationY: 0 });
      others.forEach(function (o) { gsap.set(o.el, { x: slots[o.i].x, opacity: 1 }); });
      finish();
      return;
    }
    var st = Flip.getState(c.el);
    c.el.classList.remove("story-open");
    gsap.set(c.el, { xPercent: -50, yPercent: -50, x: slots[c.i].x, y: slots[c.i].y, rotation: TABLE_ROT[c.i] });
    Flip.from(st, { duration: 0.5, ease: "power2.inOut",
      onComplete: function () { // re-assert gsap-managed transforms (Flip leaves a raw transform string)
        gsap.set(c.el, { clearProps: "transform" });
        gsap.set(c.el, { xPercent: -50, yPercent: -50, x: slots[c.i].x, y: slots[c.i].y,
          rotation: TABLE_ROT[c.i], scale: 1, zIndex: N - c.i });
        finish();
      } });
    gsap.to(c.flipper, { rotationY: 0, duration: 0.5, ease: "power2.inOut" });
    others.forEach(function (o, k) {
      gsap.to(o.el, { x: slots[o.i].x, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.15 + k * 0.05 });
    });
  }

  /* ═══════════ input wiring ═══════════ */
  cards.forEach(function (c) {
    c.front.addEventListener("click", function () {
      if (state === "deck") deal();
      else if (state === "table") openStory(c);
    });
  });

  window.addEventListener("popstate", function () { if (state === "story") closeStory(); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (state === "story") history.back();
      else if (state === "table") shuffle();
    }
    if (state === "table" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      var fronts = cards.map(function (c) { return c.front; });
      var at = fronts.indexOf(document.activeElement);
      if (at > -1) {
        var next = fronts[(at + (e.key === "ArrowRight" ? 1 : fronts.length - 1)) % fronts.length];
        next.focus();
        e.preventDefault();
      }
    }
  });

  var rTimer;
  window.addEventListener("resize", function () {
    clearTimeout(rTimer);
    rTimer = setTimeout(function () {
      computeSlots();
      if (state === "table") {
        cards.forEach(function (c) { gsap.set(c.el, { x: slots[c.i].x, y: slots[c.i].y }); });
      }
    }, 150);
  });

  /* deep link: #gallery/<id> on load → jump straight to that story */
  (function () {
    var m = location.hash.match(/^#gallery\/(.+)$/);
    if (!m) return;
    var c = cards.filter(function (c) { return c.cat.id === m[1]; })[0];
    if (!c) return;
    history.replaceState(null, "", location.pathname + location.search);
    if (hint) { hintDismissed = true; hint.remove(); }
    stopIdle();
    cards.forEach(function (o, i) {
      gsap.set(o.el, { x: slots[i].x, y: slots[i].y, rotation: TABLE_ROT[i], scale: 1 });
      gsap.set(o.band, { opacity: 1 });
      o.front.setAttribute("aria-label", o.cat.title + " — open this pile");
    });
    state = "table";
    openStory(c, true);
  })();
})();

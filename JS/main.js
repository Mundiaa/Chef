/* ==========================================================================
   Chef Melvin — Portfolio Site
   Phase 1 MVP interactivity. Vanilla JS, no build step required.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll cue on hero
     --------------------------------------------------------------------- */
  var scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var about = document.getElementById("about");
      if (about) about.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
     Portfolio filter
     --------------------------------------------------------------------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var galleryItems = document.querySelectorAll(".gallery-item");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var filter = btn.getAttribute("data-filter");
      galleryItems.forEach(function (item) {
        var match = filter === "all" || item.getAttribute("data-category") === filter;
        item.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ---------------------------------------------------------------------
     Before / after compare slider (mouse, touch, keyboard)
     --------------------------------------------------------------------- */
  var compare = document.getElementById("compare");
  var compareBefore = compare ? compare.querySelector(".compare-before") : null;
  var handle = document.getElementById("compareHandle");

  function setComparePosition(percent) {
    percent = Math.max(0, Math.min(100, percent));
    compareBefore.style.clipPath = "inset(0 " + (100 - percent) + "% 0 0)";
    handle.style.left = percent + "%";
    handle.setAttribute("aria-valuenow", Math.round(percent));
  }

  if (compare && compareBefore && handle) {
    var dragging = false;

    function positionFromClientX(clientX) {
      var rect = compare.getBoundingClientRect();
      var percent = ((clientX - rect.left) / rect.width) * 100;
      setComparePosition(percent);
    }

    handle.addEventListener("pointerdown", function (e) {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      positionFromClientX(e.clientX);
    });
    handle.addEventListener("pointerup", function () { dragging = false; });
    handle.addEventListener("pointercancel", function () { dragging = false; });

    handle.addEventListener("keydown", function (e) {
      var current = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft") { setComparePosition(current - 5); e.preventDefault(); }
      if (e.key === "ArrowRight") { setComparePosition(current + 5); e.preventDefault(); }
    });

    setComparePosition(50);
  }

  /* ---------------------------------------------------------------------
     Recipe card — servings scaler, unit toggle, ingredient render
     --------------------------------------------------------------------- */
  var BASE_SERVINGS = 4;
  var MIN_SERVINGS = 1;
  var MAX_SERVINGS = 12;

  // Quantities below are calibrated for BASE_SERVINGS (4).
  // "scales: false" ingredients (salt, pepper, oil-to-taste) stay fixed.
  var RECIPE = [
    { name: "Sea scallops", metric: { qty: 12, unit: "pcs" }, imperial: { qty: 12, unit: "pcs" }, scales: true },
    { name: "Unsalted butter", metric: { qty: 60, unit: "g" }, imperial: { qty: 4, unit: "tbsp" }, scales: true },
    { name: "Garlic cloves", metric: { qty: 2, unit: "cloves" }, imperial: { qty: 2, unit: "cloves" }, scales: true },
    { name: "Fresh thyme", metric: { qty: 3, unit: "sprigs" }, imperial: { qty: 3, unit: "sprigs" }, scales: true },
    { name: "Lemon, juiced", metric: { qty: 1, unit: "whole" }, imperial: { qty: 1, unit: "whole" }, scales: true },
    { name: "Sea salt & black pepper", metric: { qty: null, unit: "to taste" }, imperial: { qty: null, unit: "to taste" }, scales: false }
  ];

  var COOK_STEPS = [
    "Pat the scallops completely dry and season both sides with salt and pepper.",
    "Heat a heavy skillet over high heat until just smoking. Add a thin layer of neutral oil.",
    "Sear scallops 1.5–2 minutes per side, undisturbed, until golden. Remove and rest.",
    "Lower heat to medium. Add butter, garlic, and thyme; baste until butter turns nutty brown.",
    "Return scallops to the pan briefly to coat in the brown butter, finish with lemon juice, and plate."
  ];

  var servings = BASE_SERVINGS;
  var currentUnit = "metric";

  var servingsVal = document.getElementById("servingsVal");
  var servingsOut = document.getElementById("servingsOut");
  var ingredientsList = document.getElementById("ingredientsList");
  var servingsUp = document.getElementById("servingsUp");
  var servingsDown = document.getElementById("servingsDown");
  var unitButtons = document.querySelectorAll(".unit-toggle button");

  function formatQty(num) {
    // Round to a friendly fraction-ish precision without a fractions lib.
    var rounded = Math.round(num * 100) / 100;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
  }

  function renderIngredients() {
    if (!ingredientsList) return;
    var ratio = servings / BASE_SERVINGS;
    ingredientsList.innerHTML = "";
    RECIPE.forEach(function (item) {
      var li = document.createElement("li");
      var data = item[currentUnit];
      var qtyText;
      if (!item.scales || data.qty === null) {
        qtyText = data.unit;
      } else {
        qtyText = formatQty(data.qty * ratio) + " " + data.unit;
      }
      li.innerHTML = "<span>" + item.name + "</span><b>" + qtyText + "</b>";
      ingredientsList.appendChild(li);
    });
  }

  function updateServingsDisplay() {
    if (servingsVal) servingsVal.textContent = String(servings);
    if (servingsOut) servingsOut.textContent = String(servings);
  }

  if (servingsUp) {
    servingsUp.addEventListener("click", function () {
      servings = Math.min(MAX_SERVINGS, servings + 1);
      updateServingsDisplay();
      renderIngredients();
    });
  }
  if (servingsDown) {
    servingsDown.addEventListener("click", function () {
      servings = Math.max(MIN_SERVINGS, servings - 1);
      updateServingsDisplay();
      renderIngredients();
    });
  }
  unitButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      unitButtons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      currentUnit = btn.getAttribute("data-unit");
      renderIngredients();
    });
  });

  updateServingsDisplay();
  renderIngredients();

  /* ---------------------------------------------------------------------
     Cook Mode — step-by-step overlay
     --------------------------------------------------------------------- */
  var cookMode = document.getElementById("cookMode");
  var startCookMode = document.getElementById("startCookMode");
  var closeCookMode = document.getElementById("closeCookMode");
  var cookModeStep = document.getElementById("cookModeStep");
  var cookModeProgress = document.getElementById("cookModeProgress");
  var cookModeBar = document.getElementById("cookModeBar");
  var cookModePrev = document.getElementById("cookModePrev");
  var cookModeNext = document.getElementById("cookModeNext");
  var stepIndex = 0;

  function renderCookStep() {
    cookModeStep.textContent = COOK_STEPS[stepIndex];
    cookModeProgress.textContent = "Step " + (stepIndex + 1) + " of " + COOK_STEPS.length;
    cookModeBar.style.width = ((stepIndex + 1) / COOK_STEPS.length * 100) + "%";
    cookModePrev.disabled = stepIndex === 0;
    cookModeNext.textContent = stepIndex === COOK_STEPS.length - 1 ? "Done" : "Next step";
  }

  function openCookMode() {
    stepIndex = 0;
    renderCookStep();
    cookMode.hidden = false;
    closeCookMode.focus();
  }
  function closeCookModeFn() {
    cookMode.hidden = true;
    startCookMode.focus();
  }

  if (startCookMode) startCookMode.addEventListener("click", openCookMode);
  if (closeCookMode) closeCookMode.addEventListener("click", closeCookModeFn);
  if (cookMode) {
    cookMode.addEventListener("click", function (e) {
      if (e.target === cookMode) closeCookModeFn();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cookMode && !cookMode.hidden) closeCookModeFn();
  });
  if (cookModeNext) {
    cookModeNext.addEventListener("click", function () {
      if (stepIndex < COOK_STEPS.length - 1) {
        stepIndex++;
        renderCookStep();
      } else {
        closeCookModeFn();
      }
    });
  }
  if (cookModePrev) {
    cookModePrev.addEventListener("click", function () {
      if (stepIndex > 0) {
        stepIndex--;
        renderCookStep();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Contact form — front-end only validation + status message.
     Wire this up to an email service (Formspree, Resend, etc.) or your
     own backend before going live; right now nothing is actually sent.
     --------------------------------------------------------------------- */
  var contactForm = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var message = document.getElementById("message").value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !message || !emailPattern.test(email)) {
        formStatus.textContent = "Please fill in your name, a valid email, and a message.";
        formStatus.className = "form-status is-error";
        return;
      }

      formStatus.textContent = "This is a prototype form — no message was actually sent. Connect a form service to go live.";
      formStatus.className = "form-status is-success";
      contactForm.reset();
    });
  }
})();
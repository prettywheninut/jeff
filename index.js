/* ============================================================
   REVIVE PLUS — "The Glow Edit"
   Vanilla JS. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Scroll progress ---------- */
  var progressBar = $("#progressBar");
  function onScrollProgress() {
    if (!progressBar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progressBar.style.width = pct + "%";
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el, i) {
      // gentle stagger for siblings
      el.style.transitionDelay = (Math.min(i % 6, 4) * 60) + "ms";
      revealIO.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuBtn");
  var mobileNav = $("#mobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mobileNav.hidden = open;
    });
    $$("a", mobileNav).forEach(function (link) {
      link.addEventListener("click", function () {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
        mobileNav.hidden = true;
      });
    });
  }

  /* ---------- Stat counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null;
    var dur = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var statNums = $$(".stat__num");
  if (statNums.length) {
    if ("IntersectionObserver" in window) {
      var statIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      statNums.forEach(function (el) { statIO.observe(el); });
    } else {
      statNums.forEach(animateCount);
    }
  }

  /* ---------- Countdown (to next midnight) ---------- */
  var cdH = $("#cdH"), cdM = $("#cdM"), cdS = $("#cdS");
  function pad(n) { return String(n).padStart(2, "0"); }
  function tickCountdown() {
    if (!cdH) return;
    var now = new Date();
    var end = new Date(now);
    end.setHours(24, 0, 0, 0);
    var diff = Math.max(0, end - now);
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    cdH.textContent = pad(h);
    cdM.textContent = pad(m);
    cdS.textContent = pad(s);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- FAQ: only one open at a time ---------- */
  var faqItems = $$("#faqList .faq__item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- Reviews carousel ---------- */
  var track = $("#carouselTrack");
  var dotsWrap = $("#carouselDots");
  var prevBtn = $("#prevReview");
  var nextBtn = $("#nextReview");

  if (track && dotsWrap) {
    var cards = $$(".review", track);
    var index = 0;
    var autoTimer = null;

    function visibleCount() {
      if (window.innerWidth <= 760) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }
    function maxIndex() { return Math.max(0, cards.length - visibleCount()); }

    function buildDots() {
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= maxIndex(); i++) {
        var b = document.createElement("button");
        b.className = "dot" + (i === index ? " is-active" : "");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Go to review group " + (i + 1));
        b.setAttribute("aria-selected", i === index ? "true" : "false");
        b.dataset.index = i;
        b.addEventListener("click", function () {
          index = parseInt(this.dataset.index, 10);
          update();
          restartAuto();
        });
        dotsWrap.appendChild(b);
      }
    }

    function update() {
      if (index > maxIndex()) index = maxIndex();
      if (index < 0) index = 0;
      var first = cards[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var step = first.getBoundingClientRect().width + gap;
      track.style.transform = "translateX(" + (-index * step) + "px)";
      $$(".dot", dotsWrap).forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    }

    function go(dir) {
      index += dir;
      if (index > maxIndex()) index = 0;
      if (index < 0) index = maxIndex();
      update();
    }

    function restartAuto() {
      if (reduceMotion) return;
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { go(1); }, 6500);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); restartAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1); restartAuto(); });

    // pause on hover / focus
    var carousel = $("#carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", function () { clearInterval(autoTimer); });
      carousel.addEventListener("mouseleave", restartAuto);
      carousel.addEventListener("focusin", function () { clearInterval(autoTimer); });
      carousel.addEventListener("focusout", restartAuto);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildDots();
        update();
      }, 150);
    });

    buildDots();
    update();
    restartAuto();
  }

  /* ---------- Before / after slider ---------- */
  var ba = $("#ba");
  var baRange = $("#baRange");
  if (ba && baRange) {
    var setPos = function (v) {
      ba.style.setProperty("--pos", v + "%");
    };
    setPos(baRange.value);
    baRange.addEventListener("input", function () { setPos(this.value); });
    // nudge once on first view to hint interactivity
    if ("IntersectionObserver" in window && !reduceMotion) {
      var nudged = false;
      var baIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !nudged) {
            nudged = true;
            var start = 50, target = 38, t0 = null;
            function nudge(ts) {
              if (t0 === null) t0 = ts;
              var p = Math.min((ts - t0) / 900, 1);
              var eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
              var val = start + (target - start) * eased;
              baRange.value = val;
              setPos(val);
              if (p < 1) requestAnimationFrame(nudge);
            }
            requestAnimationFrame(nudge);
            baIO.disconnect();
          }
        });
      }, { threshold: 0.4 });
      baIO.observe(ba);
    }
  }

  /* ---------- Skin quiz ---------- */
  var quizForm = $("#quizForm");
  if (quizForm) {
    var steps = $$(".quiz-step", quizForm);
    var backBtn = $("#quizBack");
    var nextBtn = $("#quizNext");
    var progress = $("#quizProgress");
    var resultBox = $("#quizResult");
    var resultName = $("#quizResultName");
    var resultTag = $("#quizResultTag");
    var resultDesc = $("#quizResultDesc");
    var quizCard = $("#quizCard");
    var step = 0;
    var answers = {};

    var VARIANTS = {
      rose: {
        name: "Rose Glow",
        tag: "For combination skin that can't decide.",
        desc: "Your T-zone wants a blotting paper; your cheeks want a blanket. Rose Glow is buffered with rose water, glycerin and sandalwood so it mattifies the middle without punishing the edges. Mix with curd on dry days.",
        price: "₹399"
      },
      neem: {
        name: "Neem Clear",
        tag: "For oily, breakout-prone skin.",
        desc: "Fuller's earth and kaolin pull out oil and congestion, while neem and a whisper of tea tree keep the chin situation calm. It's the weekly reset your skin has been asking for — without the tight, squeaky aftermath.",
        price: "₹399"
      },
      saffron: {
        name: "Saffron Radiance",
        tag: "For dull, tan-prone skin.",
        desc: "Saffron, a touch of turmeric and vitamin C help surface dullness and mild tan look clearer and more even. Not a bleach. Not a filter. Just your own glow, with the lights turned up a little.",
        price: "₹399"
      }
    };

    function currentRadios() {
      return $$('input[type="radio"]', steps[step]);
    }

    function refreshNav() {
      var checked = currentRadios().some(function (r) { return r.checked; });
      nextBtn.disabled = !checked;
      backBtn.disabled = step === 0;
      nextBtn.textContent = step === steps.length - 1 ? "See my match" : "Next";
      progress.style.width = ((step + 1) / steps.length) * 100 + "%";
    }

    function showStep(n) {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === n); });
      step = n;
      refreshNav();
    }

    quizForm.addEventListener("change", function (e) {
      if (e.target && e.target.type === "radio") {
        answers[e.target.name] = e.target.value;
        refreshNav();
      }
    });

    backBtn.addEventListener("click", function () {
      if (step > 0) showStep(step - 1);
    });

    nextBtn.addEventListener("click", function () {
      if (nextBtn.disabled) return;
      if (step < steps.length - 1) {
        showStep(step + 1);
      } else {
        showResult();
      }
    });

    function showResult() {
      var tally = { rose: 0, neem: 0, saffron: 0 };
      Object.keys(answers).forEach(function (k) {
        if (tally[answers[k]] !== undefined) tally[answers[k]]++;
      });
      var winner = "rose";
      Object.keys(tally).forEach(function (k) {
        if (tally[k] > tally[winner]) winner = k;
      });
      // tie-break: prefer neem for oil/breakout answers
      if (tally.neem === tally[winner] && tally.neem > 0 && answers.q2 === "neem") winner = "neem";

      var v = VARIANTS[winner];
      resultName.textContent = v.name;
      resultTag.textContent = v.tag;
      resultDesc.textContent = v.desc;
      $("#quizAdd").textContent = "Add my match — " + v.price;
      $("#quizAdd").dataset.variant = v.name;

      quizForm.hidden = true;
      resultBox.hidden = false;
      progress.style.width = "100%";
    }

    $("#quizRetake").addEventListener("click", function () {
      quizForm.reset();
      answers = {};
      resultBox.hidden = true;
      quizForm.hidden = false;
      showStep(0);
    });

    $("#quizAdd").addEventListener("click", function () {
      var variant = this.dataset.variant || "Rose Glow";
      addToCart(variant, 399);
    });

    showStep(0);
  }

  /* ---------- Cart + toast ---------- */
  var cartCountEl = $("#cartCount");
  var cartCount = 0;
  var toastEl = $("#toast");
  var toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
    }, 2800);
  }

  function addToCart(name, price) {
    cartCount += 1;
    if (cartCountEl) {
      cartCountEl.textContent = String(cartCount);
      cartCountEl.classList.add("is-on");
    }
    showToast("Added: " + name + " · ₹" + price + " — nice choice.");
  }

  var addKit = $("#addKit");
  var addSingle = $("#addSingle");
  var stickyAdd = $("#stickyAdd");
  var cartBtn = $("#cartBtn");

  if (addKit) addKit.addEventListener("click", function () { addToCart("The Shaadi Season Kit", "1,099"); });
  if (addSingle) addSingle.addEventListener("click", function () { addToCart("Revive Plus — Rose & Saffron", "399"); });
  if (stickyAdd) stickyAdd.addEventListener("click", function () { addToCart("Revive Plus — Rose & Saffron", "399"); });
  if (cartBtn) cartBtn.addEventListener("click", function () {
    showToast(cartCount === 0 ? "Your bag is empty — the clay is waiting." : "Your bag has " + cartCount + " item" + (cartCount > 1 ? "s" : "") + ".");
  });

  /* ---------- Sticky buy bar ---------- */
  var stickyBar = $("#stickyBuy");
  var offerSection = $("#offer");
  var heroSection = $(".hero");

  function onStickyVisibility() {
    if (!stickyBar) return;
    var y = window.scrollY || window.pageYOffset;
    var heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 600;
    var offerRect = offerSection ? offerSection.getBoundingClientRect() : null;
    var offerVisible = offerRect && offerRect.top < window.innerHeight * 0.85 && offerRect.bottom > 0;
    var show = y > heroBottom * 0.72 && !offerVisible;
    stickyBar.classList.toggle("is-on", show);
    stickyBar.setAttribute("aria-hidden", show ? "false" : "true");
  }

  /* ---------- Share ---------- */
  $$(".share-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.dataset.share;
      var url = window.location.href;
      if (type === "whatsapp") {
        window.open("https://wa.me/?text=" + encodeURIComponent("This multani mitti story is worth a read: " + url), "_blank", "noopener");
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            showToast("Link copied.");
          }).catch(function () { showToast("Copy failed — just use the address bar."); });
        } else {
          showToast("Link: " + url);
        }
      }
    });
  });

  /* ---------- Newsletter ---------- */
  var newsForm = $("#newsForm");
  var newsNote = $("#newsNote");
  if (newsForm) {
    newsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#newsEmail");
      var val = input ? input.value.trim() : "";
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        if (newsNote) newsNote.textContent = "That email looks a little off. Try again?";
        return;
      }
      if (newsNote) newsNote.textContent = "You're in. First letter lands this Sunday.";
      newsForm.reset();
    });
  }

  /* ---------- Scroll listeners (rAF throttled) ---------- */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        onScrollProgress();
        onStickyVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScrollProgress();
  onStickyVisibility();

  /* ---------- Anchor offset for sticky header ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      // keep the URL useful without a jump
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });
})();

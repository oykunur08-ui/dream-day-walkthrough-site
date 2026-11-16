/* Walkthrough — scroll-driven product story.
   Desktop (≥ desktopQuery): pinned stage on the left, explanation column on the right.
   The active beat is whichever card centre is nearest the reading line, computed
   from scroll position every frame, so scrolling backwards restores frames exactly.
   Mobile / no-JS: the static screenshot + explanation sequence in the HTML. */
(function () {
  "use strict";

  function Walkthrough(section, opts) {
    if (!section) return;
    opts = opts || {};
    var desktop = window.matchMedia(opts.desktopQuery || "(min-width: 900px)");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var readingLine = opts.readingLine == null ? 0.5 : opts.readingLine;
    var parallaxPx = opts.parallaxPx == null ? 16 : opts.parallaxPx;

    var $ = function (sel, root) { return (root || section).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || section).querySelectorAll(sel)); };

    var beats = $$("[data-beat]");
    var cards = beats.map(function (b) { return $(".beat__card", b); });
    var stageImgs = $$("[data-stage-img]");
    var stageHl = $("[data-stage-hl]");
    var stageFrame = $(".frame");
    var countEl = $("[data-count]");
    var roleNodes = $$(".roles [data-role-node]");
    var roleLinks = $$("[data-role-link]");
    var bg = $("[data-parallax]");
    var link = $("[data-link]");
    var linkPath = $("[data-link-path]");
    var linkA = $("[data-link-a]");
    var linkB = $("[data-link-b]");

    var data = beats.map(function (b) {
      var hl = b.getAttribute("data-hl").split(/\s+/).map(Number);
      return {
        el: b,
        role: b.getAttribute("data-role"),
        node: Number(b.getAttribute("data-role-node")),
        image: b.getAttribute("data-image"),
        hl: { x: hl[0], y: hl[1], w: hl[2], h: hl[3] },
        title: $(".beat__title", b).textContent.trim(),
        alt: $(".shot__img", b).getAttribute("alt")
      };
    });

    var active = -1;
    var inView = false;
    var raf = 0;
    var stageLoaded = false;

    /* ---------- stage ---------- */
    function loadStage() {
      if (stageLoaded) return;
      stageLoaded = true;
      stageImgs.forEach(function (img) {
        var src = img.getAttribute("data-src");
        if (src && !img.getAttribute("src")) img.src = src; // preload all eight
      });
    }

    function setHl(el, hl) {
      el.style.setProperty("--x", hl.x);
      el.style.setProperty("--y", hl.y);
      el.style.setProperty("--w", hl.w);
      el.style.setProperty("--h", hl.h);
    }

    function setActive(i) {
      if (i === active || i < 0 || i >= data.length) return;
      active = i;
      var d = data[i];

      stageImgs.forEach(function (img, k) {
        var on = k === i;
        img.classList.toggle("is-active", on);
        if (on) img.removeAttribute("aria-hidden"); else img.setAttribute("aria-hidden", "true");
      });
      if (stageHl) setHl(stageHl, d.hl);
      if (countEl) countEl.textContent = String(i + 1).padStart(2, "0");

      roleNodes.forEach(function (n, k) {
        n.classList.toggle("is-current", k === d.node);
        n.classList.toggle("is-done", k < d.node);
        if (k === d.node) n.setAttribute("aria-current", "step"); else n.removeAttribute("aria-current");
      });
      roleLinks.forEach(function (l, k) { l.classList.toggle("is-filled", k < d.node); });

      beats.forEach(function (b, k) {
        b.classList.toggle("is-active", k === i);
        if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
    }

    function computeActive() {
      var line = window.innerHeight * readingLine;
      var best = 0, bestDist = Infinity;
      for (var k = 0; k < cards.length; k++) {
        var r = cards[k].getBoundingClientRect();
        var dist = Math.abs(r.top + r.height / 2 - line);
        if (dist < bestDist) { bestDist = dist; best = k; }
      }
      return best;
    }

    /* ---------- connector line (endpoints from rendered elements) ---------- */
    function drawLink() {
      if (!link || active < 0) return;
      var vh = window.innerHeight;
      var card = cards[active];
      var meta = $(".beat__meta", card);
      var cr = card.getBoundingClientRect();
      var mr = meta.getBoundingClientRect();
      var hr = stageHl.getBoundingClientRect();
      var fr = stageFrame.getBoundingClientRect();

      var ax = cr.left - 10;
      var ay = mr.top + mr.height / 2;
      var tx = hr.right;
      var ty = Math.min(Math.max(ay, hr.top + 14), hr.bottom - 14);

      var visible = fr.top >= -2 && fr.bottom <= vh + 2 && ay > 8 && ay < vh - 8 && ax - tx > 16;
      link.classList.toggle("is-on", visible);
      if (!visible) return;

      var mx = tx + (ax - tx) * 0.5;
      var dy = ty - ay;
      var r = Math.min(10, Math.abs(dy) / 2, (ax - tx) / 4);
      var d;
      if (Math.abs(dy) < 1) {
        d = "M" + ax + " " + ay + " H" + tx;
      } else {
        var s = dy > 0 ? 1 : -1;
        d = "M" + ax + " " + ay +
            " H" + (mx + r) +
            " Q" + mx + " " + ay + " " + mx + " " + (ay + s * r) +
            " V" + (ty - s * r) +
            " Q" + mx + " " + ty + " " + (mx - r) + " " + ty +
            " H" + tx;
      }
      linkPath.setAttribute("d", d);
      linkA.setAttribute("cx", ax); linkA.setAttribute("cy", ay);
      linkB.setAttribute("cx", tx); linkB.setAttribute("cy", ty);
    }

    function parallax() {
      if (!bg) return;
      if (reduce.matches) { bg.style.transform = ""; return; }
      var r = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height); // 0 → 1 across the section
      p = Math.min(1, Math.max(0, p));
      bg.style.transform = "translate3d(0," + ((0.5 - p) * 2 * parallaxPx).toFixed(2) + "px,0)";
    }

    function frame() {
      raf = 0;
      if (!desktop.matches) return;
      setActive(computeActive());
      drawLink();
      parallax();
      if (inView) raf = window.requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = window.requestAnimationFrame(frame); }

    /* ---------- cards: click / keyboard to jump to a beat ---------- */
    function scrollToBeat(i) {
      var r = cards[i].getBoundingClientRect();
      var top = window.scrollY + r.top + r.height / 2 - window.innerHeight * readingLine;
      window.scrollTo({ top: top, behavior: reduce.matches ? "auto" : "smooth" });
    }

    function enhanceTitles(on) {
      data.forEach(function (d, i) {
        var h = $(".beat__title", d.el);
        var btn = $(".beat__jump", h);
        if (on && !btn) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.className = "beat__jump";
          btn.textContent = h.textContent;
          btn.setAttribute("aria-label", "Show step " + (i + 1) + " of " + data.length + ": " + d.title);
          btn.addEventListener("click", function () { scrollToBeat(i); });
          h.textContent = "";
          h.appendChild(btn);
        } else if (!on && btn) {
          h.textContent = btn.textContent;
        }
      });
    }

    /* ---------- mobile: tap to enlarge ---------- */
    var lb = document.querySelector("[data-lightbox]");
    var lbImg = lb && lb.querySelector("[data-lightbox-img]");
    var lbHl = lb && lb.querySelector("[data-lightbox-hl]");
    var lbCap = lb && lb.querySelector("[data-lightbox-cap]");
    var lbClose = lb && lb.querySelector("[data-lightbox-close]");
    var lastTrigger = null;

    function openLightbox(i, trigger) {
      if (!lb || typeof lb.showModal !== "function") { window.open(data[i].image, "_blank", "noopener"); return; }
      var d = data[i];
      lbImg.src = d.image;
      lbImg.alt = d.alt;
      setHl(lbHl, d.hl);
      lbCap.textContent = String(i + 1).padStart(2, "0") + " / " + d.role + " — " + d.title;
      lastTrigger = trigger;
      lb.showModal();
      lbClose.focus();
      // open panned to the highlighted area
      var sc = lb.querySelector(".lightbox__scroll");
      var shotW = lbImg.parentNode.getBoundingClientRect().width;
      sc.scrollLeft = Math.max(0, (d.hl.x + d.hl.w / 2) / 100 * shotW - sc.clientWidth / 2);
    }
    if (lb) {
      lbClose.addEventListener("click", function () { lb.close(); });
      lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
      lb.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); lb.close(); } });
      lb.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });
    }

    data.forEach(function (d, i) {
      var fig = $(".beat__figure", d.el);
      if (!fig) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "beat__zoom";
      b.setAttribute("aria-label", "Enlarge screenshot " + (i + 1) + " of " + data.length + ": " + d.title);
      b.innerHTML = '<span class="beat__zoom-chip" aria-hidden="true">⤢ Enlarge</span>';
      b.addEventListener("click", function () { openLightbox(i, b); });
      fig.appendChild(b);
    });

    /* ---------- lifecycle ---------- */
    function applyMode() {
      if (desktop.matches) {
        loadStage();
        enhanceTitles(true);
        active = -1;
        kick();
      } else {
        enhanceTitles(false);
        if (link) link.classList.remove("is-on");
        if (bg) bg.style.transform = "";
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) kick();
        else if (link) link.classList.remove("is-on");
      }, { rootMargin: "10% 0px" }).observe(section);
    } else {
      inView = true;
    }

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    if (desktop.addEventListener) desktop.addEventListener("change", applyMode);
    else if (desktop.addListener) desktop.addListener(applyMode);

    applyMode();
    setActive(0);
  }

  window.DreamDay = window.DreamDay || {};
  window.DreamDay.Walkthrough = Walkthrough;
})();

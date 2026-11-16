/* Subtle fade-up for .reveal elements that start below the fold.
   Anything already on screen at load is left alone (page is complete at rest). */
(function () {
  "use strict";

  function Reveal(selector) {
    var els = Array.prototype.slice.call(document.querySelectorAll(selector || ".reveal"));
    if (!els.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var vh = window.innerHeight;
    var pending = els.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.92; });
    pending.forEach(function (el) { el.classList.add("is-pending"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        entry.target.classList.remove("is-pending");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    pending.forEach(function (el) { io.observe(el); });

    // Safety net: never leave content hidden (e.g. a jump past it, or thumbnails).
    window.addEventListener("hashchange", revealAll);
    function revealAll() { pending.forEach(function (el) { el.classList.remove("is-pending"); }); }
  }

  window.DreamDay = window.DreamDay || {};
  window.DreamDay.Reveal = Reveal;
})();

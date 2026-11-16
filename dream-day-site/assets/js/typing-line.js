/* TypingLine — reusable type/delete loop with a caret.
   Markup contract (see the hero in index.html):
     [data-typing]                root (gets .is-typing / .is-static)
       [data-typing-sr]           stable screen-reader text (all phrases)
       [data-typing-sizer]        invisible copy of the longest phrase (reserves space)
       [data-typing-text]         the live text; the caret follows it
   Usage: DreamDay.TypingLine(rootEl, { phrases, timing }) → { stop() } */
(function () {
  "use strict";

  function TypingLine(root, opts) {
    var phrases = opts.phrases || [];
    var t = opts.timing || {};
    var textEl = root.querySelector("[data-typing-text]");
    var sizerEl = root.querySelector("[data-typing-sizer]");
    var srEl = root.querySelector("[data-typing-sr]");
    if (!textEl || !phrases.length) return { stop: function () {} };

    var longest = phrases.reduce(function (a, b) { return b.length > a.length ? b : a; }, "");
    if (sizerEl) sizerEl.textContent = longest;
    if (srEl) srEl.textContent = phrases.join(" ");

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var timer = null, i = 0, n = 0;

    function later(fn, ms) { timer = window.setTimeout(fn, Math.max(0, ms)); }
    function stop() { window.clearTimeout(timer); timer = null; }
    function jitter() { var j = t.typeJitter || 0; return j ? (Math.random() * 2 - 1) * j : 0; }
    function render() { textEl.textContent = phrases[i].slice(0, n); }

    function typeStep() {
      root.classList.add("is-typing");
      n += 1; render();
      if (n < phrases[i].length) later(typeStep, t.typeMs + jitter());
      else { root.classList.remove("is-typing"); later(deleteStep, t.holdMs); }
    }
    function deleteStep() {
      root.classList.add("is-typing");
      n -= 1; render();
      if (n > 0) later(deleteStep, t.deleteMs);
      else {
        root.classList.remove("is-typing");
        i = (i + 1) % phrases.length;
        later(typeStep, t.gapMs);
      }
    }

    function showStatic() {
      stop();
      i = 0; n = phrases[0].length; render();
      root.classList.remove("is-typing");
      root.classList.add("is-static");
    }
    function start() {
      stop();
      root.classList.remove("is-static", "is-typing");
      i = 0; n = 0; render();
      later(typeStep, t.startDelay);
    }

    if (reduce.matches) showStatic(); else start();
    var onChange = function (e) { if (e.matches) showStatic(); else start(); };
    if (reduce.addEventListener) reduce.addEventListener("change", onChange);
    else if (reduce.addListener) reduce.addListener(onChange);

    return { stop: stop };
  }

  window.DreamDay = window.DreamDay || {};
  window.DreamDay.TypingLine = TypingLine;
})();

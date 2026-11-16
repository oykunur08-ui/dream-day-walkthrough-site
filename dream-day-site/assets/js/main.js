(function () {
  "use strict";
  var DD = window.DreamDay;
  var cfg = DD.config;

  document.querySelectorAll("[data-typing]").forEach(function (el) {
    DD.TypingLine(el, cfg.hero);
  });
  DD.Reveal(".reveal");
  DD.Walkthrough(document.getElementById("walkthrough"), cfg.walkthrough);
})();

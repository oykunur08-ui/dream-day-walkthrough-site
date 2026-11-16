/* Dream Day — editable settings.
   Hero phrases and timing live here. Walkthrough copy lives in data/storyboard.json
   (run `python3 tools/build.py` after editing it). */
window.DreamDay = window.DreamDay || {};

window.DreamDay.config = {
  hero: {
    // Typed and deleted in this order, looping forever.
    phrases: [
      "More momentum, less friction to build?",
      "More alignment, fewer status meetings?",
      "More proactive support, less firefighting?"
    ],
    timing: {
      startDelay: 900,  // empty line + blinking caret before the first phrase
      typeMs: 55,       // per character while typing
      typeJitter: 12,   // ± ms of human variation per typed character (0 = metronomic)
      holdMs: 1800,     // completed phrase stays on screen
      deleteMs: 25,     // per character while backspacing
      gapMs: 350        // empty pause before the next phrase
    }
  },

  walkthrough: {
    desktopQuery: "(min-width: 900px)",
    readingLine: 0.5,   // fraction of viewport height where a beat becomes active
    parallaxPx: 16      // max movement of the background dot grid
  }
};

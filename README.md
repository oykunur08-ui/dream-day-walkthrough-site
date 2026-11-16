# Dream Day website (sections 1–3)

Static site with no dependencies or build step to run it. Open `index.html` through any static server, for example:

    python3 -m http.server 8000

## Structure

- `index.html` contains the page, with three sections: hero, Meet Dream Day, and the walkthrough.
- `assets/css/site.css` holds all styles. Colour and type tokens are at the top.
- `assets/js/config.js` holds the settings you can edit: hero phrases and timing, the walkthrough breakpoint, the reading line and the parallax amount.
- `assets/js/typing-line.js` is the reusable type/delete component, `DreamDay.TypingLine(rootEl, { phrases, timing })`.
- `assets/js/reveal.js` handles the fade-in on scroll.
- `assets/js/walkthrough.js` drives the pinned stage, highlight, connector line, role strip and mobile enlarge.
- `assets/frames/` contains the eight original 1920×904 frames, unaltered.
- `data/storyboard.json` is the single source for the eight beats.
- `tools/build.py` renders the beats from `storyboard.json` into `index.html`. `--bundle` also writes `dist/`, a single HTML file with the frames beside it.

## Editing

- To change the hero phrases or timing, edit `assets/js/config.js`.
- To change walkthrough copy or highlight boxes, edit `data/storyboard.json`, then run `python3 tools/build.py`.
- Two highlight heights were extended from the kit's starting bounds so the box covers what the copy describes:
  - Beat 01: height 40 → 52, which adds the uploaded notes file.
  - Beat 03: height 23 → 41, which adds the first challenge with its source.
- Both prototype buttons link to https://spotify-portal-demo.onrender.com/demo-gate?step=passphrase. They open in a new tab with `rel="noopener noreferrer"`.

#!/usr/bin/env python3
"""Render the walkthrough beats from data/storyboard.json into index.html.

storyboard.json is the single source for the eight beats (image, role, copy,
highlight). Run this after editing it:

    python3 tools/build.py            # update index.html in place
    python3 tools/build.py --bundle   # also write dist/ (single-file HTML + frames)
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
DATA = ROOT / "data" / "storyboard.json"

# Role handoff strip: Chris → Champion → Developer → Chris.
# Each beat maps to one node; the first "Chris" run is node 0, the last is node 3.
def role_nodes(steps):
    nodes, current, last_role = [], -1, None
    for s in steps:
        if s["role"] != last_role:
            current += 1
            last_role = s["role"]
        nodes.append(current)
    return nodes


def e(s):
    return html.escape(s, quote=True)


def render(steps):
    nodes = role_nodes(steps)
    total = len(steps)
    stage, beats = [], []
    for i, s in enumerate(steps):
        n = f"{i + 1:02d}"
        h = s["highlight"]
        hl = f'--x:{h["x"]};--y:{h["y"]};--w:{h["width"]};--h:{h["height"]}'
        hl_data = f'{h["x"]} {h["y"]} {h["width"]} {h["height"]}'
        active = " is-active" if i == 0 else ""
        stage.append(
            f'                  <img class="shot__img{active}" data-stage-img="{i}" data-src="{e(s["image"])}" '
            f'alt="{e(s["alt"])}" width="1920" height="904" decoding="async"{"" if i == 0 else " aria-hidden=\"true\""}>'
        )
        beats.append(f'''          <li class="beat{active}" id="beat-{n}" data-beat="{i}" data-role="{e(s["role"])}" data-role-node="{nodes[i]}" data-hl="{hl_data}" data-image="{e(s["image"])}">
            <figure class="beat__figure">
              <div class="shot shot--figure">
                <img class="shot__img is-active" src="{e(s["image"])}" alt="{e(s["alt"])}" width="1920" height="904" loading="lazy" decoding="async">
                <span class="hl hl--outline" style="{hl}"></span>
              </div>
            </figure>
            <article class="beat__card" aria-labelledby="beat-{n}-title">
              <p class="beat__meta"><span class="beat__num">{n}<span class="sr-only"> of {total:02d}</span></span><span class="beat__role">{e(s["role"])}</span></p>
              <h3 class="beat__title" id="beat-{n}-title">{e(s["title"])}</h3>
              <p class="beat__text">{e(s["explanation"])}</p>
              <p class="beat__value"><span class="beat__value-k">For Chris: </span>{e(s["chrisValue"])}</p>
            </article>
          </li>''')
    return "\n".join(stage), "\n".join(beats)


def splice(src, marker, body):
    pattern = re.compile(rf"(<!-- {marker}:START -->)(.*?)(<!-- {marker}:END -->)", re.S)
    if not pattern.search(src):
        sys.exit(f"marker {marker} not found in index.html")
    return pattern.sub(lambda m: f"{m.group(1)}\n{body}\n{m.group(3)}", src)


def bundle(src):
    """Single HTML file with CSS/JS inlined; frames copied beside it."""
    dist = ROOT / "dist"
    if dist.exists():
        shutil.rmtree(dist)
    (dist / "assets").mkdir(parents=True)
    shutil.copytree(ROOT / "assets" / "frames", dist / "assets" / "frames")
    css = (ROOT / "assets/css/site.css").read_text()
    out = src.replace('<link rel="stylesheet" href="assets/css/site.css">', f"<style>\n{css}\n</style>")

    def inline_js(m):
        return "<script>\n" + (ROOT / m.group(1)).read_text() + "\n</script>"

    out = re.sub(r'<script src="(assets/js/[^"]+)"></script>', inline_js, out)
    (dist / "index.html").write_text(out)
    print("bundled → dist/index.html")


def main():
    data = json.loads(DATA.read_text())
    stage, beats = render(data["steps"])
    src = INDEX.read_text()
    src = splice(src, "STAGE", stage)
    src = splice(src, "BEATS", beats)
    INDEX.write_text(src)
    print(f"rendered {len(data['steps'])} beats into index.html")
    if "--bundle" in sys.argv:
        bundle(src)


if __name__ == "__main__":
    main()

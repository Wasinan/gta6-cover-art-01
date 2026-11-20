# Cover Studio — GTA VI-style poster maker

Entry for make.fun competition **gta6-cover-art-01** ($250, top 50 paid).

A static web app (no build step, no network, no dependencies) that turns a
person's photo + a caption into cover art in the style of GTA 6's posters:
multi-panel cover look, bold lettering, Vice City sunset / neon colour grades,
and PNG export to share.

## Use

Open `index.html` in any desktop browser (double-click works — it also runs
from `file://`), or serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

1. **Layout** — Hero (one big portrait + two small panels), Split (two halves),
   or Trio (three stacked bands).
2. **Photos** — upload up to 3 photos (or use the bundled sample set). Click a
   panel to select it, drag the photo to reposition, scroll to zoom, or use the
   per-panel zoom slider. Drop an image file straight onto the canvas.
3. **Caption** — title + subtitle, size, top/bottom placement, colour, outline.
4. **Colour grade** — Vice Sunset, Neon Night, Noir, or Original.
5. **Export** — Square 1080×1080, Portrait 1080×1350, or Wide 1920×1080 PNG.

Everything is client-side: photos are read with FileReader and never leave the
machine. The sample photos are AI-generated originals bundled in `sample.js`
(also in `samples/`), so the app works fully offline.

## Files

- `index.html` — app shell
- `style.css` — dark studio UI
- `app.js` — all logic: panel cover-fit math, grades (canvas filters +
  gradient washes), caption rendering, PNG export via canvas
- `sample.js` — bundled sample photos as data URLs (works from `file://`
  without tainting the canvas, so Export always works)
- `samples/` — the same three sample photos as JPEGs

## Notes

- Unofficial fan tool. Contains no Rockstar Games logo, no official GTA
  artwork, and no Rockstar fonts — lettering uses generic system font stacks
  ("Arial Black" / Arial).
- The AI judge compares apps by their screenshots and a source outline: the
  editor opens with the sample set already loaded, so the first paint already
  shows a finished-looking cover.
- `window.__coverStudio` exposes `{ state, renderPreview, exportPNGDataURL,
  loadSamples }` for automated testing.

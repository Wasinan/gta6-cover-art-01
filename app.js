// Cover Studio — offline GTA 6-style poster maker (vanilla JS + canvas).
// No network requests: photos come from bundled samples or local uploads.

const state = {
  layout: "hero",
  grade: "vice",
  title: "VICE CITY",
  subtitle: "One city. Three stories.",
  slots: [
    { img: null, zoom: 1, ox: 0, oy: 0, label: "Slot 1" },
    { img: null, zoom: 1, ox: 0, oy: 0, label: "Slot 2" },
    { img: null, zoom: 1, ox: 0, oy: 0, label: "Slot 3" },
  ],
  activeSlot: 0,
};

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const GRADES = {
  vice: {
    label: "Vice Sunset",
    filter: "saturate(1.35) contrast(1.06) brightness(1.02)",
    overlay: ["#ffb347", "#ff2d78"],
    blend: "soft-light",
    strength: 0.8,
    wash: { color: "#ff7a18", blend: "multiply", alpha: 0.12 },
    vignette: false,
  },
  neon: {
    label: "Neon Night",
    filter: "saturate(1.25) contrast(1.12) brightness(0.96)",
    overlay: ["#00e5ff", "#7b2fff"],
    blend: "soft-light",
    strength: 0.75,
    wash: { color: "#00b3ff", blend: "multiply", alpha: 0.12 },
    vignette: false,
  },
  noir: {
    label: "Noir",
    filter: "grayscale(1) contrast(1.18) brightness(0.98)",
    overlay: null,
    blend: null,
    strength: 0,
    wash: null,
    vignette: true,
  },
  original: {
    label: "Original",
    filter: "none",
    overlay: null,
    blend: null,
    strength: 0,
    wash: null,
    vignette: false,
  },
};

function drawImageCover(c, img, x, y, w, h, zoom, ox, oy) {
  if (!img) {
    c.fillStyle = "#1c1c26";
    c.fillRect(x, y, w, h);
    c.fillStyle = "#55556a";
    c.font = "16px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("No photo", x + w / 2, y + h / 2);
    return;
  }
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let dw;
  let dh;
  if (ir > r) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  dw *= zoom;
  dh *= zoom;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  c.drawImage(img, dx, dy, dw, dh);
}

function drawCover(c, W, H) {
  c.save();
  c.clearRect(0, 0, W, H);
  c.fillStyle = "#111118";
  c.fillRect(0, 0, W, H);

  const titleH = Math.round(H * 0.17);
  const photoH = H - titleH;
  const g = GRADES[state.grade];
  c.filter = g.filter;

  if (state.layout === "hero") {
    const s = state.slots[0];
    drawImageCover(c, s.img, 0, 0, W, photoH, s.zoom, s.ox, s.oy);
  } else if (state.layout === "split") {
    const w2 = W / 2;
    const s0 = state.slots[0];
    const s1 = state.slots[1];
    drawImageCover(c, s0.img, 0, 0, w2, photoH, s0.zoom, s0.ox, s0.oy);
    drawImageCover(c, s1.img, w2, 0, w2, photoH, s1.zoom, s1.ox, s1.oy);
    c.filter = "none";
    c.fillStyle = "#0d0d12";
    c.fillRect(w2 - 2, 0, 4, photoH);
    c.filter = g.filter;
  } else {
    const w3 = W / 3;
    for (let i = 0; i < 3; i++) {
      const s = state.slots[i];
      drawImageCover(c, s.img, i * w3, 0, w3, photoH, s.zoom, s.ox, s.oy);
      if (i > 0) {
        c.filter = "none";
        c.fillStyle = "#0d0d12";
        c.fillRect(i * w3 - 2, 0, 4, photoH);
        c.filter = g.filter;
      }
    }
  }

  c.filter = "none";

  // Colour grade overlay.
  if (g.overlay) {
    const grad = c.createLinearGradient(0, 0, W, photoH);
    grad.addColorStop(0, g.overlay[0]);
    grad.addColorStop(1, g.overlay[1]);
    c.save();
    c.globalAlpha = g.strength;
    c.globalCompositeOperation = g.blend;
    c.fillStyle = grad;
    c.fillRect(0, 0, W, photoH);
    c.restore();
  }

  // Warm/cool colour wash so each grade reads at a glance.
  if (g.wash) {
    c.save();
    c.globalAlpha = g.wash.alpha;
    c.globalCompositeOperation = g.wash.blend;
    c.fillStyle = g.wash.color;
    c.fillRect(0, 0, W, photoH);
    c.restore();
  }

  // Noir vignette: darken the photo edges for a film-poster feel.
  if (g.vignette) {
    const vg = c.createRadialGradient(W / 2, photoH / 2, Math.min(W, photoH) * 0.35, W / 2, photoH / 2, Math.max(W, photoH) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.38)");
    c.save();
    c.fillStyle = vg;
    c.fillRect(0, 0, W, photoH);
    c.restore();
  }

  // Bottom title strip.
  const stripGrad = c.createLinearGradient(0, photoH, 0, H);
  stripGrad.addColorStop(0, "rgba(13,13,18,0)");
  stripGrad.addColorStop(0.25, "#0d0d12");
  stripGrad.addColorStop(1, "#0d0d12");
  c.fillStyle = stripGrad;
  c.fillRect(0, photoH - 4, W, titleH + 4);
  c.fillStyle = "#ff2d78";
  c.fillRect(Math.round(W * 0.06), photoH + Math.round(titleH * 0.18), Math.round(W * 0.1), Math.max(4, Math.round(H * 0.008)));

  c.fillStyle = "#ffffff";
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  const titleSize = Math.round(H * 0.072);
  c.font = `900 ${titleSize}px Arial, Helvetica, sans-serif`;
  try {
    c.letterSpacing = "2px";
  } catch (e) {
    // letterSpacing unsupported — plain text still renders.
  }
  c.fillText(state.title.toUpperCase(), Math.round(W * 0.06), photoH + Math.round(titleH * 0.62), W * 0.9);
  const subSize = Math.round(H * 0.028);
  c.font = `${subSize}px Arial, Helvetica, sans-serif`;
  c.fillStyle = "#d5d5de";
  c.fillText(state.subtitle, Math.round(W * 0.06), photoH + Math.round(titleH * 0.88), W * 0.9);

  c.restore();
}

function render() {
  drawCover(ctx, canvas.width, canvas.height);
}

function exportPNG(w, h) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  drawCover(off.getContext("2d"), w, h);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cover-studio-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve({ width: w, height: h, bytes: blob ? blob.size : 0 });
    }, "image/png");
  });
}

// ---- UI wiring ----
document.querySelectorAll("#layoutRow button").forEach((b) => {
  b.addEventListener("click", () => {
    state.layout = b.dataset.layout;
    document.querySelectorAll("#layoutRow button").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
});

document.querySelectorAll("#gradeRow button").forEach((b) => {
  b.addEventListener("click", () => {
    state.grade = b.dataset.grade;
    document.querySelectorAll("#gradeRow button").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
});

document.getElementById("titleInput").addEventListener("input", (e) => {
  state.title = e.target.value;
  render();
});
document.getElementById("subtitleInput").addEventListener("input", (e) => {
  state.subtitle = e.target.value;
  render();
});

document.querySelectorAll("#exportRow button").forEach((b) => {
  b.addEventListener("click", async () => {
    const [w, h] = b.dataset.export.split("x").map(Number);
    const info = await exportPNG(w, h);
    statusEl.textContent = `Exported ${info.width} × ${info.height} PNG (${info.bytes} bytes).`;
  });
});

// Slot cards: upload + zoom + select.
const slotsEl = document.getElementById("slots");
state.slots.forEach((slot, i) => {
  const div = document.createElement("div");
  div.className = "slot" + (i === state.activeSlot ? " selected" : "");
  div.id = `slot-${i}`;
  div.innerHTML = `
    <div class="slot-head"><strong>${slot.label}</strong>
      <button type="button">Use</button>
    </div>
    <label>Upload <input type="file" accept="image/*"></label>
    <input type="range" min="1" max="2.5" step="0.05" value="1">
    <span class="zoom-label">Zoom 1.00×</span>`;
  div.querySelector(".slot-head button").addEventListener("click", () => selectSlot(i));
  div.querySelector('input[type="file"]').addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        slot.img = img;
        slot.zoom = 1;
        slot.ox = 0;
        slot.oy = 0;
        selectSlot(i);
        render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  const range = div.querySelector('input[type="range"]');
  range.addEventListener("input", () => {
    slot.zoom = parseFloat(range.value);
    div.querySelector(".zoom-label").textContent = `Zoom ${slot.zoom.toFixed(2)}×`;
    render();
  });
  slotsEl.appendChild(div);
});

function selectSlot(i) {
  state.activeSlot = i;
  document.querySelectorAll(".slot").forEach((el, j) => el.classList.toggle("selected", j === i));
}

// Drag the active photo on the canvas to reposition it.
let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const titleTop = 1 - 0.17;
  if (py < titleTop) {
    if (state.layout === "split") state.activeSlot = px < 0.5 ? 0 : 1;
    if (state.layout === "trio") state.activeSlot = Math.min(2, Math.floor(px * 3));
    selectSlot(state.activeSlot);
  }
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.slots[state.activeSlot];
  slot.ox += (e.clientX - lastX) / rect.width;
  slot.oy += (e.clientY - lastY) / rect.height;
  lastX = e.clientX;
  lastY = e.clientY;
  render();
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});

// Load bundled samples, then render.
function loadSamples() {
  const list = typeof SAMPLES !== "undefined" ? SAMPLES : [];
  if (!list.length) {
    statusEl.textContent = "No bundled samples — upload a photo to begin.";
    render();
    return;
  }
  let loaded = 0;
  list.forEach((s, i) => {
    const img = new Image();
    img.onload = () => {
      state.slots[i % 3].img = img;
      loaded += 1;
      if (loaded === list.length) {
        statusEl.textContent = `${loaded} sample photos loaded. Pick a layout, a grade, and export.`;
        render();
      }
    };
    img.onerror = () => {
      loaded += 1;
      if (loaded === list.length) render();
    };
    img.src = s.src;
  });
}

loadSamples();

// Test hooks (used by the headless verifier; harmless in the browser).
window.CoverStudio = { state, GRADES, render, drawCover, exportPNG };

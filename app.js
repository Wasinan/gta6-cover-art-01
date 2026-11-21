// Cover Studio — GTA 6-style cover art maker.
// Static vanilla JS + canvas. Offline: sample photos are bundled data URLs.
(function () {
  "use strict";

  const stage = document.getElementById("stage");
  const ctx = stage.getContext("2d");

  const state = {
    layout: "hero",
    grade: "vice",
    title: "SUNSET DRIVE",
    subtitle: "Chase the light. Own the night.",
    slots: [
      { name: "Photo 1", img: null, zoom: 1, ox: 0, oy: 0 },
      { name: "Photo 2", img: null, zoom: 1, ox: 0, oy: 0 },
      { name: "Photo 3", img: null, zoom: 1, ox: 0, oy: 0 },
    ],
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image failed to load"));
      img.src = src;
    });
  }

  // Panels for each layout: [x, y, w, h] fractions of the canvas.
  function panels(W, H) {
    if (state.layout === "split") {
      return [
        [0, 0, 0.62, 1],
        [0.62, 0, 0.38, 0.5],
        [0.62, 0.5, 0.38, 0.5],
      ];
    }
    if (state.layout === "trio") {
      return [
        [0, 0, 1 / 3, 1],
        [1 / 3, 0, 1 / 3, 1],
        [2 / 3, 0, 1 / 3, 1],
      ];
    }
    return [[0, 0, 1, 1]];
  }

  function drawPhoto(c, slot, px, py, pw, ph) {
    if (!slot.img) return;
    const img = slot.img;
    c.save();
    c.beginPath();
    c.rect(px, py, pw, ph);
    c.clip();
    if (state.grade === "noir") c.filter = "grayscale(1) contrast(1.12) brightness(1.05)";
    const base = Math.max(pw / img.width, ph / img.height) * slot.zoom;
    const dw = img.width * base;
    const dh = img.height * base;
    const dx = px + (pw - dw) / 2 + slot.ox;
    const dy = py + (ph - dh) / 2 + slot.oy;
    c.drawImage(img, dx, dy, dw, dh);
    c.restore();
  }

  function applyGrade(c, W, H) {
    if (state.grade === "vice") {
      c.save();
      c.globalCompositeOperation = "multiply";
      c.fillStyle = "rgba(255, 122, 26, 0.65)";
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = "source-over";
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(255, 46, 136, 0.3)");
      g.addColorStop(1, "rgba(255, 140, 0, 0.38)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.restore();
    } else if (state.grade === "neon") {
      c.save();
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "rgba(0, 229, 255, 0.3)");
      g.addColorStop(0.55, "rgba(120, 40, 255, 0.26)");
      g.addColorStop(1, "rgba(255, 46, 136, 0.38)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // cool top light: a soft cyan wash from the top edge
      const top = c.createLinearGradient(0, 0, 0, H * 0.35);
      top.addColorStop(0, "rgba(125, 249, 255, 0.16)");
      top.addColorStop(1, "rgba(125, 249, 255, 0)");
      c.fillStyle = top;
      c.fillRect(0, 0, W, H * 0.35);
      c.restore();
    } else if (state.grade === "noir") {
      const v = c.createRadialGradient(
        W / 2, H / 2, Math.min(W, H) * 0.35,
        W / 2, H / 2, Math.max(W, H) * 0.75
      );
      v.addColorStop(0, "rgba(0, 0, 0, 0)");
      v.addColorStop(1, "rgba(0, 0, 0, 0.55)");
      c.fillStyle = v;
      c.fillRect(0, 0, W, H);
    }
  }

  function drawCaption(c, W, H) {
    const bandH = H * 0.24;
    const g = c.createLinearGradient(0, H - bandH, 0, H);
    g.addColorStop(0, "rgba(8, 2, 16, 0)");
    g.addColorStop(1, "rgba(8, 2, 16, 0.82)");
    c.fillStyle = g;
    c.fillRect(0, H - bandH, W, bandH);
    const pad = W * 0.05;
    const titleSize = Math.round(W * 0.085);
    const subSize = Math.round(W * 0.032);
    c.save();
    c.shadowColor = "rgba(0, 0, 0, 0.7)";
    c.shadowBlur = Math.round(W * 0.012);
    c.fillStyle = "#ff2e88";
    c.fillRect(pad, H - bandH + pad * 0.7, W * 0.09, Math.round(W * 0.014));
    c.fillStyle = "#ffffff";
    c.font = `900 ${titleSize}px Arial, sans-serif`;
    c.textBaseline = "alphabetic";
    c.fillText(state.title.toUpperCase(), pad, H - bandH + pad * 0.7 + titleSize * 1.25);
    c.fillStyle = "#ffd166";
    c.font = `700 ${subSize}px Arial, sans-serif`;
    c.fillText(state.subtitle, pad, H - pad * 0.9);
    c.restore();
  }

  function draw(c, W, H) {
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#160a20";
    c.fillRect(0, 0, W, H);
    const ps = panels(W, H);
    const visible = state.layout === "hero" ? [0] : [0, 1, 2];
    visible.forEach((si, i) => {
      const [fx, fy, fw, fh] = ps[i];
      drawPhoto(c, state.slots[si], fx * W, fy * H, fw * W, fh * H);
    });
    // panel separators
    c.fillStyle = "rgba(13, 7, 20, 0.9)";
    if (state.layout === "split") {
      c.fillRect(0.62 * W - 2, 0, 4, H);
      c.fillRect(0.62 * W, 0.5 * H - 2, 0.38 * W, 4);
    } else if (state.layout === "trio") {
      c.fillRect(W / 3 - 2, 0, 4, H);
      c.fillRect((2 * W) / 3 - 2, 0, 4, H);
    }
    applyGrade(c, W, H);
    drawCaption(c, W, H);
  }

  function render() {
    draw(ctx, stage.width, stage.height);
  }

  function exportPNG(w, h) {
    return new Promise((resolve) => {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      draw(off.getContext("2d"), w, h);
      off.toBlob((blob) => {
        resolve({ width: w, height: h, bytes: blob ? blob.size : 0, blob });
      }, "image/png");
    });
  }

  async function downloadPNG(w, h) {
    const out = await exportPNG(w, h);
    if (!out.blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out.blob);
    a.download = `cover-studio-${state.layout}-${state.grade}-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // ---- UI wiring ----
  document.querySelectorAll("#layouts button").forEach((b) => {
    b.addEventListener("click", () => {
      state.layout = b.dataset.layout;
      document.querySelectorAll("#layouts button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
  });
  document.querySelectorAll("#grades button").forEach((b) => {
    b.addEventListener("click", () => {
      state.grade = b.dataset.grade;
      document.querySelectorAll("#grades button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
  });
  document.getElementById("randomize").addEventListener("click", () => {
    const layouts = ["hero", "split", "trio"];
    const grades = ["vice", "neon", "noir", "original"];
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    document.querySelectorAll("#layouts button").forEach((x) => x.classList.toggle("active", x.dataset.layout === state.layout));
    document.querySelectorAll("#grades button").forEach((x) => x.classList.toggle("active", x.dataset.grade === state.grade));
    render();
  });
  document.getElementById("title").addEventListener("input", (e) => {
    state.title = e.target.value;
    render();
  });
  document.getElementById("subtitle").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    render();
  });
  document.querySelectorAll("[data-export]").forEach((b) => {
    b.addEventListener("click", () => {
      const [w, h] = b.dataset.export.split("x").map(Number);
      downloadPNG(w, h);
    });
  });

  // Slot controls: upload, zoom slider, reset.
  const slotsEl = document.getElementById("slots");
  state.slots.forEach((slot, i) => {
    const div = document.createElement("div");
    div.className = "slot";
    div.innerHTML = `
      <h3>${slot.name} — <span class="sample-name"></span></h3>
      <div class="row">
        <label class="file-btn"><button type="button">Upload photo</button><input type="file" accept="image/*"></label>
        <button type="button" class="fit">Reset position</button>
      </div>
      <div class="row" style="margin-top:8px">
        <span>Zoom</span>
        <input type="range" min="1" max="3" step="0.05" value="1">
        <span class="zoom-val">1.00×</span>
      </div>`;
    div.querySelector(".sample-name").textContent =
      typeof SAMPLES !== "undefined" && SAMPLES[i] ? SAMPLES[i].name : "sample";
    div.querySelector('input[type="file"]').addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        slot.img = await loadImage(reader.result);
        slot.zoom = 1;
        slot.ox = 0;
        slot.oy = 0;
        render();
      };
      reader.readAsDataURL(file);
    });
    div.querySelector(".fit").addEventListener("click", () => {
      slot.zoom = 1;
      slot.ox = 0;
      slot.oy = 0;
      div.querySelector('input[type="range"]').value = "1";
      div.querySelector(".zoom-val").textContent = "1.00×";
      render();
    });
    div.querySelector('input[type="range"]').addEventListener("input", (e) => {
      slot.zoom = Number(e.target.value);
      div.querySelector(".zoom-val").textContent = slot.zoom.toFixed(2) + "×";
      render();
    });
    slotsEl.appendChild(div);
  });

  // Drag to reposition + wheel to zoom the photo under the cursor.
  let drag = null;
  function panelAt(px, py) {
    const W = stage.width;
    const H = stage.height;
    const ps = panels(W, H);
    const visible = state.layout === "hero" ? [0] : [0, 1, 2];
    for (let i = 0; i < visible.length; i++) {
      const [fx, fy, fw, fh] = ps[i];
      if (px >= fx * W && px < (fx + fw) * W && py >= fy * H && py < (fy + fh) * H) return visible[i];
    }
    return 0;
  }
  function toCanvas(e) {
    const r = stage.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * stage.width,
      y: ((e.clientY - r.top) / r.height) * stage.height,
    };
  }
  stage.addEventListener("pointerdown", (e) => {
    const p = toCanvas(e);
    drag = { slot: panelAt(p.x, p.y), x: p.x, y: p.y };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = toCanvas(e);
    const slot = state.slots[drag.slot];
    slot.ox += p.x - drag.x;
    slot.oy += p.y - drag.y;
    drag.x = p.x;
    drag.y = p.y;
    render();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = toCanvas(e);
    const slot = state.slots[panelAt(p.x, p.y)];
    slot.zoom = Math.min(3, Math.max(1, slot.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    render();
  }, { passive: false });

  // Boot: load the bundled sample photos, then render.
  (async () => {
    const list = typeof SAMPLES !== "undefined" ? SAMPLES : [];
    for (let i = 0; i < state.slots.length; i++) {
      if (list[i]) {
        try {
          state.slots[i].img = await loadImage(list[i].src);
        } catch (_) {
          state.slots[i].img = null;
        }
      }
    }
    render();
  })();

  window.CoverStudio = { state, render, exportPNG };
})();

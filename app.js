// Cover Studio — GTA 6 style cover art, fully offline.
// 3 layouts (Hero/Split/Trio), 3 photo slots (upload / drag / zoom / fit-fill),
// caption editor, 4 grades, PNG export at 1080x1080, 1080x1350, 1920x1080.
// Exposes window.CoverStudio { state, render, exportPNG } for the page UI.
(function () {
  "use strict";

  var canvas = document.getElementById("stage");
  var ctx = canvas.getContext("2d");

  var GRADES = ["original", "vice", "neon", "noir"];
  var LAYOUTS = ["hero", "split", "trio"];

  var state = {
    layout: "hero",
    grade: "original",
    title: "VICE CITY DAWN",
    subtitle: "Every sunrise is a getaway.",
    grain: true,
    slots: [0, 1, 2].map(function (i) {
      return {
        img: null,
        name: (typeof SAMPLES !== "undefined" && SAMPLES[i]) ? SAMPLES[i].name : ("Photo " + (i + 1)),
        x: 0, y: 0, zoom: 1, fit: "fill",
      };
    }),
  };

  // ---- layout geometry -------------------------------------------------
  function rectsFor(layout, W, H) {
    if (layout === "split") {
      return [
        { x: 0, y: 0, w: W, h: H / 2 },
        { x: 0, y: H / 2, w: W, h: H / 2 },
      ];
    }
    if (layout === "trio") {
      return [
        { x: 0, y: 0, w: W, h: H * 0.55 },
        { x: 0, y: H * 0.55, w: W / 2, h: H * 0.45 },
        { x: W / 2, y: H * 0.55, w: W / 2, h: H * 0.45 },
      ];
    }
    return [{ x: 0, y: 0, w: W, h: H }];
  }

  // ---- photo drawing ---------------------------------------------------
  function drawPhoto(c, slot, r) {
    var img = slot.img;
    if (!img || !img.naturalWidth) return;
    var base = slot.fit === "fit"
      ? Math.min(r.w / img.naturalWidth, r.h / img.naturalHeight)
      : Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
    var s = base * slot.zoom;
    var dw = img.naturalWidth * s;
    var dh = img.naturalHeight * s;
    var dx = r.x + (r.w - dw) / 2 + slot.x * r.w;
    var dy = r.y + (r.h - dh) / 2 + slot.y * r.h;
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    if (state.grade === "noir") c.filter = "grayscale(1) contrast(1.18) brightness(1.02)";
    c.drawImage(img, dx, dy, dw, dh);
    c.filter = "none";
    c.restore();
  }

  function vignette(c, W, H) {
    var g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  function gradeOverlay(c, W, H) {
    var g;
    if (state.grade === "vice") {
      g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(255,45,149,0.34)");
      g.addColorStop(0.55, "rgba(255,110,60,0.18)");
      g.addColorStop(1, "rgba(255,170,40,0.30)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,140,0,0.10)";
      c.fillRect(0, 0, W, H);
      vignette(c, W, H);
    } else if (state.grade === "neon") {
      g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "rgba(0,200,255,0.30)");
      g.addColorStop(0.5, "rgba(120,60,255,0.16)");
      g.addColorStop(1, "rgba(255,45,149,0.30)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(0,120,255,0.08)";
      c.fillRect(0, 0, W, H);
      vignette(c, W, H);
    } else if (state.grade === "noir") {
      c.fillStyle = "rgba(0,0,0,0.12)";
      c.fillRect(0, 0, W, H);
      vignette(c, W, H);
    }
  }

  // Deterministic film grain (fixed seed, so two exports are identical).
  function grain(c, W, H) {
    if (!state.grain) return;
    var seed = 20261121;
    function rnd() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    var n = Math.floor((W * H) / 900);
    c.save();
    for (var i = 0; i < n; i++) {
      var v = rnd();
      c.fillStyle = v > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      c.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), 2, 2);
    }
    c.restore();
  }

  function caption(c, W, H) {
    var bandH = Math.round(H * 0.16);
    var y = H - bandH;
    c.fillStyle = "rgba(10,5,20,0.80)";
    c.fillRect(0, y, W, bandH);
    var ag = c.createLinearGradient(0, y, 0, y + bandH);
    ag.addColorStop(0, "#ff5c8a");
    ag.addColorStop(1, "#ff9e3d");
    c.fillStyle = ag;
    c.fillRect(0, y, Math.round(W * 0.012), bandH);
    var pad = Math.round(W * 0.04);
    var titleSize = Math.round(bandH * 0.42);
    var subSize = Math.round(bandH * 0.24);
    c.fillStyle = "#ffffff";
    c.font = "800 " + titleSize + "px system-ui, sans-serif";
    c.textBaseline = "middle";
    c.textAlign = "left";
    c.fillText(state.title || "", pad + Math.round(W * 0.012), y + bandH * 0.38, W - pad * 2);
    c.fillStyle = "#ffd166";
    c.font = "500 " + subSize + "px system-ui, sans-serif";
    c.fillText(state.subtitle || "", pad + Math.round(W * 0.012), y + bandH * 0.76, W - pad * 2);
  }

  function renderInto(c, W, H) {
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#1d1030";
    c.fillRect(0, 0, W, H);
    var rects = rectsFor(state.layout, W, H);
    for (var i = 0; i < rects.length; i++) {
      var slot = state.slots[i];
      if (slot) drawPhoto(c, slot, rects[i]);
    }
    gradeOverlay(c, W, H);
    grain(c, W, H);
    caption(c, W, H);
  }

  function render() {
    renderInto(ctx, canvas.width, canvas.height);
  }

  // ---- export ----------------------------------------------------------
  function exportPNG(w, h) {
    return new Promise(function (resolve) {
      var off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      renderInto(off.getContext("2d"), w, h);
      off.toBlob(function (blob) {
        var bytes = blob ? blob.size : 0;
        if (blob) {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "cover-" + state.layout + "-" + state.grade + "-" + w + "x" + h + ".png";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        }
        resolve({ width: w, height: h, bytes: bytes });
      }, "image/png");
    });
  }

  // ---- UI wiring -------------------------------------------------------
  function bindButtons(rowId, attr, fn) {
    var row = document.getElementById(rowId);
    if (!row) return;
    row.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-" + attr + "]");
      if (!b) return;
      row.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      fn(b.getAttribute("data-" + attr));
      render();
    });
  }
  bindButtons("layoutRow", "layout", function (v) { state.layout = v; });
  bindButtons("gradeRow", "grade", function (v) { state.grade = v; });

  var titleInput = document.getElementById("titleInput");
  var subtitleInput = document.getElementById("subtitleInput");
  if (titleInput) titleInput.addEventListener("input", function () { state.title = titleInput.value; render(); });
  if (subtitleInput) subtitleInput.addEventListener("input", function () { state.subtitle = subtitleInput.value; render(); });

  var grainToggle = document.getElementById("grainToggle");
  if (grainToggle) grainToggle.addEventListener("change", function () { state.grain = grainToggle.checked; render(); });

  var randomBtn = document.getElementById("randomBtn");
  if (randomBtn) randomBtn.addEventListener("click", function () {
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    state.grade = GRADES[Math.floor(Math.random() * GRADES.length)];
    document.querySelectorAll("#layoutRow button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-layout") === state.layout); });
    document.querySelectorAll("#gradeRow button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-grade") === state.grade); });
    render();
  });

  document.querySelectorAll("button[data-export]").forEach(function (b) {
    b.addEventListener("click", function () {
      var parts = b.getAttribute("data-export").split("x");
      exportPNG(parseInt(parts[0], 10), parseInt(parts[1], 10));
    });
  });

  // ---- photo slots UI --------------------------------------------------
  var slotsEl = document.getElementById("slots");
  state.slots.forEach(function (slot, i) {
    var div = document.createElement("div");
    div.className = "slot";
    div.innerHTML =
      '<div class="name">Slot ' + (i + 1) + ' — <span class="sname"></span></div>' +
      '<img class="thumb" alt="">' +
      '<div class="controls">' +
      '<input type="file" accept="image/*">' +
      '<button class="fitbtn" type="button">Fit: fill</button>' +
      '</div>' +
      '<div class="controls"><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value="1"></div>';
    slotsEl.appendChild(div);
    var nameEl = div.querySelector(".sname");
    var thumb = div.querySelector(".thumb");
    var fileInput = div.querySelector('input[type="file"]');
    var fitBtn = div.querySelector(".fitbtn");
    var zoom = div.querySelector('input[type="range"]');
    nameEl.textContent = slot.name;
    function refreshThumb() {
      if (slot.img) thumb.src = slot.img.src;
      fitBtn.textContent = "Fit: " + slot.fit;
    }
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var im = new Image();
        im.onload = function () {
          slot.img = im;
          slot.name = f.name;
          slot.x = 0; slot.y = 0; slot.zoom = 1;
          nameEl.textContent = slot.name;
          zoom.value = "1";
          refreshThumb();
          render();
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(f);
    });
    fitBtn.addEventListener("click", function () {
      slot.fit = slot.fit === "fill" ? "fit" : "fill";
      refreshThumb();
      render();
    });
    zoom.addEventListener("input", function () {
      slot.zoom = parseFloat(zoom.value);
      render();
    });
    slot._refresh = refreshThumb;
  });

  // ---- drag to reposition ----------------------------------------------
  var drag = null;
  function slotAt(px, py) {
    var rect = canvas.getBoundingClientRect();
    var x = (px - rect.left) * (canvas.width / rect.width);
    var y = (py - rect.top) * (canvas.height / rect.height);
    var rects = rectsFor(state.layout, canvas.width, canvas.height);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return { slot: state.slots[i], rect: r, x: x, y: y };
    }
    return null;
  }
  canvas.addEventListener("pointerdown", function (e) {
    var hit = slotAt(e.clientX, e.clientY);
    if (!hit || !hit.slot.img) return;
    drag = { slot: hit.slot, rect: hit.rect, x: hit.x, y: hit.y, ox: hit.slot.x, oy: hit.slot.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (canvas.width / rect.width);
    var y = (e.clientY - rect.top) * (canvas.height / rect.height);
    drag.slot.x = Math.max(-0.6, Math.min(0.6, drag.ox + (x - drag.x) / drag.rect.w));
    drag.slot.y = Math.max(-0.6, Math.min(0.6, drag.oy + (y - drag.y) / drag.rect.h));
    render();
  });
  canvas.addEventListener("pointerup", function () { drag = null; });

  // ---- load sample photos ----------------------------------------------
  if (typeof SAMPLES !== "undefined") {
    SAMPLES.forEach(function (s, i) {
      var im = new Image();
      im.onload = function () {
        state.slots[i].img = im;
        state.slots[i].name = s.name;
        if (state.slots[i]._refresh) state.slots[i]._refresh();
        render();
      };
      im.src = s.src;
    });
  }

  render();

  window.CoverStudio = { state: state, render: render, exportPNG: exportPNG };
})();

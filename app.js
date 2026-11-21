// Cover Studio — offline poster maker (vanilla JS + canvas, no network).
(function () {
  "use strict";

  var canvas = document.getElementById("poster");
  var ctx = canvas.getContext("2d");

  var state = {
    layout: "hero",
    grade: "original",
    title: "VICE CITY NIGHTS",
    subtitle: "A story in three frames",
    slots: [
      { img: null, zoom: 1, ox: 0, oy: 0 },
      { img: null, zoom: 1, ox: 0, oy: 0 },
      { img: null, zoom: 1, ox: 0, oy: 0 }
    ]
  };

  // Regions are fractions of the canvas: [x, y, w, h].
  function regionsFor(layout) {
    if (layout === "split") {
      return [
        [0, 0, 0.5, 1],
        [0.5, 0, 0.5, 0.5],
        [0.5, 0.5, 0.5, 0.5]
      ];
    }
    if (layout === "trio") {
      return [
        [0, 0, 1 / 3, 1],
        [1 / 3, 0, 1 / 3, 1],
        [2 / 3, 0, 1 / 3, 1]
      ];
    }
    // hero: one big photo, two small insets along the bottom
    return [
      [0, 0, 1, 1],
      [0.04, 0.68, 0.26, 0.24],
      [0.70, 0.68, 0.26, 0.24]
    ];
  }

  function drawCover(c, img, rx, ry, rw, rh, slot) {
    if (!img || !img.naturalWidth) {
      c.fillStyle = "#23232f";
      c.fillRect(rx, ry, rw, rh);
      return;
    }
    var scale = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * slot.zoom;
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    var dx = rx + (rw - dw) / 2 + slot.ox * rw;
    var dy = ry + (rh - dh) / 2 + slot.oy * rh;
    c.save();
    c.beginPath();
    c.rect(rx, ry, rw, rh);
    c.clip();
    c.drawImage(img, dx, dy, dw, dh);
    c.restore();
    // thin frame so panels read as separate shots
    c.strokeStyle = "rgba(255,255,255,0.25)";
    c.lineWidth = Math.max(2, rw * 0.004);
    c.strokeRect(rx, ry, rw, rh);
  }

  function gradeFilter(grade) {
    if (grade === "vice") return "saturate(1.45) contrast(1.06) sepia(0.18)";
    if (grade === "neon") return "saturate(1.35) hue-rotate(-18deg) contrast(1.08)";
    if (grade === "noir") return "grayscale(1) contrast(1.18) brightness(0.96)";
    return "none";
  }

  function drawText(c, W, H) {
    var pad = W * 0.05;
    var titleSize = Math.round(W * 0.075);
    var subSize = Math.round(W * 0.032);
    c.save();
    c.textAlign = "center";
    c.shadowColor = "rgba(0,0,0,0.75)";
    c.shadowBlur = H * 0.012;
    c.shadowOffsetY = H * 0.004;
    c.fillStyle = "#ffffff";
    c.font = "900 " + titleSize + "px 'Arial Black', Arial, sans-serif";
    var titleY = state.layout === "hero" ? H * 0.60 : H * 0.90;
    c.fillText(state.title.toUpperCase(), W / 2, titleY, W - pad * 2);
    c.font = "600 " + subSize + "px Arial, sans-serif";
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.fillText(state.subtitle, W / 2, titleY + subSize * 1.7, W - pad * 2);
    c.restore();
  }

  function drawGradeOverlay(c, W, H) {
    if (state.grade === "vice") {
      var g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "rgba(255,46,136,0.20)");
      g.addColorStop(1, "rgba(255,122,61,0.22)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    } else if (state.grade === "neon") {
      var n = c.createLinearGradient(0, 0, 0, H);
      n.addColorStop(0, "rgba(122,92,255,0.22)");
      n.addColorStop(1, "rgba(0,229,255,0.14)");
      c.fillStyle = n;
      c.fillRect(0, 0, W, H);
    }
  }

  // Render the poster onto `target` (a canvas) at its own pixel size.
  function render(target) {
    var c = target.getContext("2d");
    var W = target.width;
    var H = target.height;
    // Draw photos + text to an offscreen layer so the grade filter applies to all of it.
    var layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    var lc = layer.getContext("2d");
    lc.fillStyle = "#0d0d12";
    lc.fillRect(0, 0, W, H);
    var regions = regionsFor(state.layout);
    for (var i = 0; i < 3; i++) {
      var r = regions[i];
      drawCover(lc, state.slots[i].img, r[0] * W, r[1] * H, r[2] * W, r[3] * H, state.slots[i]);
    }
    drawText(lc, W, H);
    c.save();
    c.clearRect(0, 0, W, H);
    c.filter = gradeFilter(state.grade);
    c.drawImage(layer, 0, 0);
    c.restore();
    drawGradeOverlay(c, W, H);
  }

  function renderPreview() {
    render(canvas);
  }

  function loadImage(src, done) {
    var img = new Image();
    img.onload = function () { done(img); };
    img.onerror = function () { done(null); };
    img.src = src;
  }

  function setSlotPhoto(i, src) {
    loadImage(src, function (img) {
      if (img) {
        state.slots[i].img = img;
        state.slots[i].ox = 0;
        state.slots[i].oy = 0;
        renderPreview();
      }
    });
  }

  // ---- UI wiring ----
  function bindButtons(id, attr, apply) {
    var wrap = document.getElementById(id);
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      wrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      apply(b.getAttribute(attr));
      renderPreview();
    });
  }
  bindButtons("layoutBtns", "data-layout", function (v) { state.layout = v; });
  bindButtons("gradeBtns", "data-grade", function (v) { state.grade = v; });

  document.querySelectorAll("[data-upload]").forEach(function (input) {
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { setSlotPhoto(+input.getAttribute("data-upload"), reader.result); };
      reader.readAsDataURL(file);
    });
  });

  document.querySelectorAll("[data-sample]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var i = +btn.getAttribute("data-sample");
      if (window.SAMPLE_PHOTOS && SAMPLE_PHOTOS[i]) setSlotPhoto(i, SAMPLE_PHOTOS[i]);
    });
  });

  document.querySelectorAll("[data-zoom]").forEach(function (slider) {
    slider.addEventListener("input", function () {
      state.slots[+slider.getAttribute("data-zoom")].zoom = parseFloat(slider.value);
      renderPreview();
    });
  });

  document.getElementById("titleInput").addEventListener("input", function (e) {
    state.title = e.target.value;
    renderPreview();
  });
  document.getElementById("subtitleInput").addEventListener("input", function (e) {
    state.subtitle = e.target.value;
    renderPreview();
  });

  // Drag to reposition the photo under the pointer.
  var drag = null;
  function slotAt(x, y) {
    var regions = regionsFor(state.layout);
    var rect = canvas.getBoundingClientRect();
    var fx = (x - rect.left) / rect.width;
    var fy = (y - rect.top) / rect.height;
    for (var i = regions.length - 1; i >= 0; i--) {
      var r = regions[i];
      if (fx >= r[0] && fx <= r[0] + r[2] && fy >= r[1] && fy <= r[1] + r[3]) return i;
    }
    return 0;
  }
  canvas.addEventListener("pointerdown", function (e) {
    drag = { slot: slotAt(e.clientX, e.clientY), x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var rect = canvas.getBoundingClientRect();
    var s = state.slots[drag.slot];
    s.ox += (e.clientX - drag.x) / rect.width;
    s.oy += (e.clientY - drag.y) / rect.height;
    s.ox = Math.max(-1, Math.min(1, s.ox));
    s.oy = Math.max(-1, Math.min(1, s.oy));
    drag.x = e.clientX;
    drag.y = e.clientY;
    renderPreview();
  });
  canvas.addEventListener("pointerup", function () { drag = null; });

  // ---- Export ----
  function exportPNG(size) {
    var parts = size.split("x");
    var W = parseInt(parts[0], 10);
    var H = parseInt(parts[1], 10);
    var off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    render(off);
    return new Promise(function (resolve) {
      off.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "cover-studio-" + size + ".png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        resolve({ width: W, height: H, bytes: blob ? blob.size : 0 });
      }, "image/png");
    });
  }

  document.getElementById("exportBtns").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    exportPNG(b.getAttribute("data-export"));
  });

  // ---- Boot: load the bundled samples, then render ----
  var loaded = 0;
  function bootDone() {
    loaded++;
    if (loaded >= 3) renderPreview();
  }
  if (window.SAMPLE_PHOTOS) {
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        loadImage(SAMPLE_PHOTOS[idx], function (img) {
          if (img) state.slots[idx].img = img;
          bootDone();
        });
      })(i);
    }
  } else {
    renderPreview();
  }

  // Headless-test hooks (also handy for debugging).
  window.__coverStudio = {
    state: state,
    render: renderPreview,
    exportPNG: exportPNG,
    setLayout: function (v) { state.layout = v; renderPreview(); },
    setGrade: function (v) { state.grade = v; renderPreview(); }
  };
})();

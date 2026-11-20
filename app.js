// Cover Studio — GTA VI-style poster maker.
// Vanilla JS + canvas only. No network, no dependencies. Runs from file:// or any static server.
// Photos are drawn from data URLs, so the canvas never taints and Export always works.

(function () {
  'use strict';

  var EXPORT_SIZES = {
    square:   { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
    portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
    wide:     { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
  };
  var PREVIEW_SIZE = {
    square:   { w: 900, h: 900 },
    portrait: { w: 864, h: 1080 },
    wide:     { w: 1080, h: 608 },
  };
  // Panel rects as fractions of the canvas. Gaps between panels read as white gutters.
  var LAYOUTS = {
    hero: [
      { x: 0,    y: 0,     w: 0.585, h: 1 },
      { x: 0.6,  y: 0,     w: 0.4,   h: 0.515 },
      { x: 0.6,  y: 0.53,  w: 0.4,   h: 0.47 },
    ],
    split: [
      { x: 0,      y: 0, w: 0.4925, h: 1 },
      { x: 0.5075, y: 0, w: 0.4925, h: 1 },
    ],
    trio: [
      { x: 0, y: 0,     w: 1, h: 0.355 },
      { x: 0, y: 0.37,  w: 1, h: 0.295 },
      { x: 0, y: 0.68,  w: 1, h: 0.32 },
    ],
  };
  var GRADES = {
    sunset:   { filter: 'saturate(1.28) contrast(1.06) brightness(1.02)',
                overlay: [[0, 'rgba(255,150,60,0.10)'], [0.5, 'rgba(255,80,120,0.07)'], [1, 'rgba(180,20,120,0.15)']] },
    neon:     { filter: 'saturate(1.45) contrast(1.10) hue-rotate(-14deg)',
                overlay: [[0, 'rgba(255,46,136,0.13)'], [1, 'rgba(34,211,238,0.13)']] },
    noir:     { filter: 'grayscale(1) contrast(1.18) brightness(1.03)', overlay: [] },
    original: { filter: 'none', overlay: [] },
  };
  var SLOT_KEYS = ['a', 'b', 'c'];

  var canvas = document.getElementById('preview');
  var ctx = canvas.getContext('2d');

  var state = freshState();

  function freshState() {
    return {
      layout: 'hero',
      grade: 'sunset',
      exportSize: 'square',
      caption: { title: 'VICE CITY', subtitle: 'WELCOME TO THE SUNSHINE STATE',
                 size: 118, pos: 'bottom', color: '#ffffff', outline: true },
      panels: SLOT_KEYS.map(function (k) { return { key: k, img: null, zoom: 1, ox: 0, oy: 0 }; }),
      active: 0,
    };
  }

  // ---------- geometry ----------
  function rectsFor(W, H) {
    return LAYOUTS[state.layout].map(function (r) {
      return { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H };
    });
  }
  // Cover-fit metrics for panel i on a W×H canvas.
  function metrics(i, W, H) {
    var r = rectsFor(W, H)[i];
    var p = state.panels[i];
    var base = Math.max(r.w / p.img.naturalWidth, r.h / p.img.naturalHeight);
    var dw = p.img.naturalWidth * base * p.zoom;
    var dh = p.img.naturalHeight * base * p.zoom;
    return { r: r, dw: dw, dh: dh,
             maxOx: Math.max(0, (dw - r.w) / 2 / r.w),
             maxOy: Math.max(0, (dh - r.h) / 2 / r.h) };
  }
  function clampOffsets(i, W, H) {
    var p = state.panels[i];
    if (!p.img) return;
    var m = metrics(i, W, H);
    p.ox = Math.max(-m.maxOx, Math.min(m.maxOx, p.ox));
    p.oy = Math.max(-m.maxOy, Math.min(m.maxOy, p.oy));
  }

  // ---------- render ----------
  function render(c, W, H) {
    var rects = rectsFor(W, H);
    var g = GRADES[state.grade];
    // Off-white board: gutters between panels read as thin white lines.
    c.fillStyle = '#f4efe6';
    c.fillRect(0, 0, W, H);
    rects.forEach(function (r, i) {
      var p = state.panels[i];
      c.save();
      c.beginPath();
      c.rect(r.x, r.y, r.w, r.h);
      c.clip();
      if (p.img) {
        var m = metrics(i, W, H);
        var dx = r.x + (r.w - m.dw) / 2 + p.ox * r.w;
        var dy = r.y + (r.h - m.dh) / 2 + p.oy * r.h;
        try { c.filter = g.filter; } catch (e) { /* older canvas: ignore */ }
        c.drawImage(p.img, dx, dy, m.dw, m.dh);
        try { c.filter = 'none'; } catch (e) {}
      } else {
        c.fillStyle = '#1c1c26';
        c.fillRect(r.x, r.y, r.w, r.h);
        c.strokeStyle = 'rgba(255,255,255,0.5)';
        c.setLineDash([10, 8]);
        c.lineWidth = Math.max(2, W * 0.002);
        c.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
        c.setLineDash([]);
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.font = '700 ' + Math.round(Math.min(W, H) * 0.028) + 'px Arial, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('PANEL ' + SLOT_KEYS[i].toUpperCase(), r.x + r.w / 2, r.y + r.h / 2 - 14);
        c.font = '400 ' + Math.round(Math.min(W, H) * 0.02) + 'px Arial, sans-serif';
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.fillText('Drop a photo here', r.x + r.w / 2, r.y + r.h / 2 + 16);
      }
      c.restore();
      // Hairline frame around the panel.
      c.strokeStyle = 'rgba(0,0,0,0.18)';
      c.lineWidth = Math.max(1, W * 0.001);
      c.strokeRect(r.x, r.y, r.w, r.h);
    });

    // Colour-grade wash + vignette.
    if (g.overlay.length) {
      var grad = c.createLinearGradient(0, 0, 0, H);
      g.overlay.forEach(function (stop) { grad.addColorStop(stop[0], stop[1]); });
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
    }
    var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);

    drawCaption(c, W, H);
    // Selected-panel marker (preview only, not on export).
    if (c === ctx) {
      var ar = rects[state.active];
      if (ar) {
        c.strokeStyle = '#22d3ee';
        c.lineWidth = 3;
        c.setLineDash([12, 8]);
        c.strokeRect(ar.x + 2, ar.y + 2, ar.w - 4, ar.h - 4);
        c.setLineDash([]);
      }
    }
  }

  function drawCaption(c, W, H) {
    var cap = state.caption;
    if (!cap.title && !cap.subtitle) return;
    var u = Math.min(W, H) / 1080;
    var titlePx = Math.max(24, cap.size * u);
    var cx = W / 2;
    var ty, sy;
    if (cap.pos === 'bottom') {
      ty = H - 42 * u;
      sy = ty - titlePx * 0.74;
    } else {
      ty = 42 * u + titlePx * 0.72;
      sy = ty + titlePx * 0.44;
    }
    // Readability scrim behind the caption band.
    var bandH = titlePx * 1.75;
    var bandY = cap.pos === 'bottom' ? H - bandH - 18 * u : 18 * u;
    var scrim = c.createLinearGradient(0, bandY, 0, bandY + bandH);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(0.5, 'rgba(0,0,0,0.38)');
    scrim.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = scrim;
    c.fillRect(0, bandY, W, bandH);

    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    var outlineCol = cap.color === '#111111' ? '#ffffff' : '#111111';
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = titlePx * 0.10;
    c.shadowOffsetY = titlePx * 0.03;

    if (cap.subtitle) {
      var subPx = Math.max(12, titlePx * 0.24);
      try { c.letterSpacing = Math.round(subPx * 0.32) + 'px'; } catch (e) {}
      c.font = '800 ' + Math.round(subPx) + 'px Arial, Helvetica, sans-serif';
      if (cap.outline) {
        c.lineWidth = Math.max(2, subPx * 0.16);
        c.lineJoin = 'round';
        c.strokeStyle = outlineCol;
        c.strokeText(cap.subtitle, cx, sy);
      }
      c.fillStyle = cap.color;
      c.fillText(cap.subtitle, cx, sy);
    }
    if (cap.title) {
      try { c.letterSpacing = Math.round(titlePx * 0.03) + 'px'; } catch (e) {}
      c.font = '900 ' + Math.round(titlePx) + 'px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      if (cap.outline) {
        c.lineWidth = Math.max(3, titlePx * 0.07);
        c.lineJoin = 'round';
        c.strokeStyle = outlineCol;
        c.strokeText(cap.title, cx, ty);
      }
      c.fillStyle = cap.color;
      c.fillText(cap.title, cx, ty);
    }
    try { c.letterSpacing = '0px'; } catch (e) {}
    c.shadowColor = 'transparent';
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
  }

  function renderPreview() {
    var ps = PREVIEW_SIZE[state.exportSize];
    if (canvas.width !== ps.w || canvas.height !== ps.h) {
      canvas.width = ps.w;
      canvas.height = ps.h;
    }
    render(ctx, canvas.width, canvas.height);
    document.getElementById('sizeLabel').textContent =
      EXPORT_SIZES[state.exportSize].label;
    document.getElementById('activeLabel').textContent =
      'Panel ' + SLOT_KEYS[state.active].toUpperCase() + ' selected';
    refreshSlots();
  }

  // ---------- photos ----------
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('image failed to load')); };
      img.src = src;
    });
  }
  function setPhoto(i, src) {
    return loadImage(src).then(function (img) {
      var p = state.panels[i];
      p.img = img;
      p.zoom = 1;
      p.ox = 0;
      p.oy = 0;
      renderPreview();
    });
  }
  function loadSamples() {
    var s = window.SAMPLE_PHOTOS;
    if (!s) return Promise.resolve();
    return Promise.all(SLOT_KEYS.map(function (k, i) {
      return setPhoto(i, s[k]).catch(function () {});
    }));
  }
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('read failed')); };
      fr.readAsDataURL(file);
    });
  }

  // ---------- slots UI ----------
  var slotsEl = document.getElementById('slots');
  SLOT_KEYS.forEach(function (k, i) {
    var div = document.createElement('div');
    div.className = 'slot';
    div.id = 'slot-' + k;
    div.innerHTML =
      '<img class="thumb" alt="Panel ' + k.toUpperCase() + ' photo">' +
      '<div>' +
        '<div class="shead"><b>PANEL ' + k.toUpperCase() + '</b><span class="sstatus">Empty</span></div>' +
        '<div class="sbtns">' +
          '<label>Upload<input type="file" accept="image/*" hidden></label>' +
          '<button type="button" class="center">Center</button>' +
        '</div>' +
        '<input type="range" min="1" max="3.5" step="0.05" value="1" aria-label="Zoom panel ' + k.toUpperCase() + '">' +
      '</div>';
    div.addEventListener('click', function (e) {
      if (e.target.closest('label,button,input')) return;
      state.active = i;
      renderPreview();
    });
    div.querySelector('input[type="file"]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      readFileAsDataURL(f).then(function (src) { return setPhoto(i, src); });
      e.target.value = '';
    });
    div.querySelector('.center').addEventListener('click', function () {
      var p = state.panels[i];
      p.zoom = 1; p.ox = 0; p.oy = 0;
      renderPreview();
    });
    div.querySelector('input[type="range"]').addEventListener('input', function (e) {
      var p = state.panels[i];
      p.zoom = parseFloat(e.target.value);
      clampOffsets(i, canvas.width, canvas.height);
      renderPreview();
    });
    slotsEl.appendChild(div);
  });
  function refreshSlots() {
    var used = LAYOUTS[state.layout].length;
    SLOT_KEYS.forEach(function (k, i) {
      var div = document.getElementById('slot-' + k);
      var p = state.panels[i];
      div.classList.toggle('active', state.active === i);
      div.classList.toggle('unused', i >= used);
      var thumb = div.querySelector('.thumb');
      var status = div.querySelector('.sstatus');
      var range = div.querySelector('input[type="range"]');
      if (p.img) {
        thumb.src = p.img.src;
        status.textContent = 'Photo loaded';
      } else {
        thumb.removeAttribute('src');
        status.textContent = i >= used ? 'Not used in this layout' : 'Empty';
      }
      if (parseFloat(range.value) !== p.zoom) range.value = p.zoom;
    });
  }

  // ---------- canvas interaction ----------
  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  function hitPanel(pos) {
    var rects = rectsFor(canvas.width, canvas.height);
    for (var i = rects.length - 1; i >= 0; i--) {
      var r = rects[i];
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) return i;
    }
    return -1;
  }
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    var pos = canvasPos(e);
    var i = hitPanel(pos);
    if (i < 0) return;
    state.active = i;
    drag = { x: pos.x, y: pos.y, ox: state.panels[i].ox, oy: state.panels[i].oy };
    canvas.setPointerCapture(e.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var pos = canvasPos(e);
    var rects = rectsFor(canvas.width, canvas.height);
    var r = rects[state.active];
    var p = state.panels[state.active];
    if (!p.img || !r) return;
    p.ox = drag.ox + (pos.x - drag.x) / r.w;
    p.oy = drag.oy + (pos.y - drag.y) / r.h;
    clampOffsets(state.active, canvas.width, canvas.height);
    renderPreview();
  });
  function endDrag() { drag = null; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = state.panels[state.active];
    if (!p.img) return;
    p.zoom = Math.max(1, Math.min(3.5, p.zoom * Math.exp(-e.deltaY * 0.0012)));
    clampOffsets(state.active, canvas.width, canvas.height);
    renderPreview();
  }, { passive: false });
  canvas.addEventListener('dragover', function (e) { e.preventDefault(); });
  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f || f.type.indexOf('image/') !== 0) return;
    var pos = canvasPos(e);
    var i = hitPanel(pos);
    if (i < 0) i = state.active;
    state.active = i;
    readFileAsDataURL(f).then(function (src) { return setPhoto(i, src); });
  });

  // ---------- controls ----------
  function bindSeg(id, attr, fn) {
    document.getElementById(id).addEventListener('click', function (e) {
      var b = e.target.closest('button[data-' + attr + ']');
      if (!b) return;
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
        x.classList.toggle('on', x === b);
      });
      fn(b.getAttribute('data-' + attr));
    });
  }
  bindSeg('layoutSeg', 'layout', function (v) {
    state.layout = v;
    if (state.active >= LAYOUTS[v].length) state.active = 0;
    renderPreview();
  });
  bindSeg('capPosSeg', 'pos', function (v) {
    state.caption.pos = v;
    renderPreview();
  });
  bindSeg('sizeSeg', 'size', function (v) {
    state.exportSize = v;
    renderPreview();
  });
  bindSeg('gradeSeg', 'grade', function (v) {
    state.grade = v;
    renderPreview();
  });
  document.getElementById('capColor').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-color]');
    if (!b) return;
    Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
      x.classList.toggle('on', x === b);
    });
    state.caption.color = b.getAttribute('data-color');
    renderPreview();
  });
  document.getElementById('capTitle').addEventListener('input', function (e) {
    state.caption.title = e.target.value.toUpperCase();
    renderPreview();
  });
  document.getElementById('capSub').addEventListener('input', function (e) {
    state.caption.subtitle = e.target.value.toUpperCase();
    renderPreview();
  });
  document.getElementById('capSize').addEventListener('input', function (e) {
    state.caption.size = parseInt(e.target.value, 10);
    renderPreview();
  });
  document.getElementById('capOutline').addEventListener('change', function (e) {
    state.caption.outline = e.target.checked;
    renderPreview();
  });
  document.getElementById('loadSample').addEventListener('click', function () { loadSamples(); });
  document.getElementById('resetAll').addEventListener('click', function () {
    var keep = state.panels;
    state = freshState();
    state.panels = keep;
    document.getElementById('capTitle').value = state.caption.title;
    document.getElementById('capSub').value = state.caption.subtitle;
    document.getElementById('capSize').value = state.caption.size;
    document.getElementById('capOutline').checked = state.caption.outline;
    document.querySelectorAll('#layoutSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-layout') === 'hero');
    });
    document.querySelectorAll('#gradeSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-grade') === 'sunset');
    });
    document.querySelectorAll('#sizeSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-size') === 'square');
    });
    document.querySelectorAll('#capPosSeg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-pos') === 'bottom');
    });
    loadSamples();
    renderPreview();
  });

  // ---------- export ----------
  function exportPNG() {
    var s = EXPORT_SIZES[state.exportSize];
    var c = document.createElement('canvas');
    c.width = s.w;
    c.height = s.h;
    render(c.getContext('2d'), s.w, s.h);
    return new Promise(function (resolve) {
      c.toBlob(function (b) { resolve(b); }, 'image/png');
    });
  }
  function exportPNGDataURL(sizeKey) {
    var s = EXPORT_SIZES[sizeKey || state.exportSize];
    var c = document.createElement('canvas');
    c.width = s.w;
    c.height = s.h;
    render(c.getContext('2d'), s.w, s.h);
    return c.toDataURL('image/png');
  }
  document.getElementById('exportBtn').addEventListener('click', function () {
    var note = document.getElementById('exportNote');
    note.textContent = 'Rendering…';
    exportPNG().then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cover-studio-' + state.exportSize + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      note.textContent = 'Exported ' + EXPORT_SIZES[state.exportSize].label + ' PNG. Saved to your downloads.';
    });
  });

  // Test hook (also handy for automation): window.__coverStudio
  window.__coverStudio = {
    state: state,
    renderPreview: renderPreview,
    exportPNGDataURL: exportPNGDataURL,
    loadSamples: loadSamples,
  };

  // First paint: sample set so the editor opens on a finished-looking cover.
  loadSamples().then(renderPreview);
  renderPreview();
})();

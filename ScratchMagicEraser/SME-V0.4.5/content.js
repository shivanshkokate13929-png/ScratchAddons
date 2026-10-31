(() => {
  if (window.__scratchMagicEraserLoaded) return;
  window.__scratchMagicEraserLoaded = true;

  const $ = (tag, attrs = {}, text = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v);
    }
    if (text) el.textContent = text;
    return el;
  };

  const launcher = $("button", { id: "sme-launcher", type: "button", title: "Open Scratch Magic Eraser" }, "✦ Magic Eraser");
  document.documentElement.append(launcher);

  const panel = $("section", { id: "sme-panel", "aria-label": "Scratch Magic Eraser" });
  panel.innerHTML = `
    <header class="sme-head"><div><strong>Scratch Magic Eraser</strong><small>Connected background remover · v0.1</small></div><button class="sme-close" title="Close" aria-label="Close">×</button></header>
    <div class="sme-body">
      <label class="sme-file">Choose image <input id="sme-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>
      <div class="sme-preview-wrap"><canvas id="sme-canvas" width="640" height="420"></canvas><div id="sme-empty">Choose an image to begin</div></div>
      <div class="sme-controls">
        <label>Tolerance <output id="sme-tol-value">28</output><input id="sme-tolerance" type="range" min="0" max="100" value="28"></label>
        <label class="sme-check"><input id="sme-eight" type="checkbox" checked> Diagonal connectivity (helps with checkerboards)</label>
      </div>
      <div class="sme-actions"><button id="sme-auto" disabled>Remove edge background</button><button id="sme-pick" disabled>Pick a background area</button><button id="sme-reset" disabled>Reset</button></div>
      <div class="sme-actions"><button id="sme-download" class="sme-primary" disabled>Export transparent PNG</button></div>
      <p id="sme-status" role="status">Tip: edge removal keeps enclosed white details intact. Start with tolerance 20–35.</p>
      <p class="sme-note">This tool edits a copy of the image. It does not alter your Scratch project automatically. Export the PNG, then upload it in Costumes → Upload Costume.</p>
    </div>`;
  document.documentElement.append(panel);

  const canvas = panel.querySelector("#sme-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const fileInput = panel.querySelector("#sme-file");
  const tolerance = panel.querySelector("#sme-tolerance");
  const tolValue = panel.querySelector("#sme-tol-value");
  const status = panel.querySelector("#sme-status");
  const empty = panel.querySelector("#sme-empty");
  const buttons = ["sme-auto", "sme-pick", "sme-reset", "sme-download"].map(id => panel.querySelector("#" + id));
  let original = null;
  let current = null;
  let imageName = "costume";
  let picking = false;

  const setStatus = message => { status.textContent = message; };
  const enabled = value => buttons.forEach(b => b.disabled = !value);
  const draw = imageData => {
    current = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(current, 0, 0);
    empty.hidden = true;
    enabled(true);
  };
  const distance = (a, b, i) => {
    const dr = a[i] - b[0], dg = a[i + 1] - b[1], db = a[i + 2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const getSeeds = (data, w, h) => {
    const seeds = [];
    // Sample every few pixels along all four edges. Quantized colors reduce noise from antialiasing.
    const seen = new Set();
    const add = i => {
      if (data[i + 3] < 8) return;
      const c = [data[i] >> 3, data[i + 1] >> 3, data[i + 2] >> 3];
      const key = c.join(",");
      if (!seen.has(key)) { seen.add(key); seeds.push([c[0] * 8 + 4, c[1] * 8 + 4, c[2] * 8 + 4]); }
    };
    const step = Math.max(1, Math.floor(Math.min(w, h) / 300));
    for (let x = 0; x < w; x += step) { add(x * 4); add(((h - 1) * w + x) * 4); }
    for (let y = 0; y < h; y += step) { add((y * w) * 4); add((y * w + w - 1) * 4); }
    // Keep a compact palette; edge backgrounds normally have one or two dominant colors.
    const counts = new Map();
    const countPixel = i => {
      if (data[i + 3] < 8) return;
      const key = [data[i] >> 4, data[i + 1] >> 4, data[i + 2] >> 4].join(",");
      counts.set(key, (counts.get(key) || 0) + 1);
    };
    for (let x = 0; x < w; x += step) { countPixel(x * 4); countPixel(((h - 1) * w + x) * 4); }
    for (let y = 0; y < h; y += step) { countPixel(y * w * 4); countPixel((y * w + w - 1) * 4); }
    const dominant = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([k]) => k.split(",").map(n => Number(n) * 16 + 8));
    return dominant.length ? dominant : seeds.slice(0, 8);
  };
  const removeFromSeeds = (imageData, seedIndices, tol, eight) => {
    const { data, width: w, height: h } = imageData;
    const total = w * h;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    const refs = [];
    const refSeen = new Set();
    for (const p of seedIndices) {
      const i = p * 4;
      if (data[i + 3] < 8) continue;
      const key = [data[i] >> 3, data[i + 1] >> 3, data[i + 2] >> 3].join(",");
      if (!refSeen.has(key)) { refSeen.add(key); refs.push([data[i], data[i + 1], data[i + 2]]); }
    }
    if (!refs.length) return { imageData, removed: 0 };
    let head = 0, tail = 0;
    for (const p of seedIndices) {
      if (!visited[p]) { visited[p] = 1; queue[tail++] = p; }
    }
    const limit = Math.max(0, Math.min(173, tol * 1.732));
    const offsets = eight ? [-w-1,-w,-w+1,-1,1,w-1,w,w+1] : [-w,-1,1,w];
    while (head < tail) {
      const p = queue[head++], x = p % w, y = (p / w) | 0, i = p * 4;
      if (data[i + 3] < 8) continue;
      let match = false;
      for (const ref of refs) {
        const dr = data[i]-ref[0], dg = data[i+1]-ref[1], db = data[i+2]-ref[2];
        if (Math.sqrt(dr*dr + dg*dg + db*db) <= limit) { match = true; break; }
      }
      if (!match) continue;
      data[i+3] = 0;
      for (const off of offsets) {
        const n = p + off;
        if (n < 0 || n >= total || visited[n]) continue;
        const nx = n % w, ny = (n / w) | 0;
        if (Math.abs(nx-x) > 1 || Math.abs(ny-y) > 1) continue;
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    return { imageData, removed: tail };
  };
  const allBorderIndices = (w, h) => {
    const a = [];
    for (let x=0; x<w; x++) { a.push(x, (h-1)*w+x); }
    for (let y=1; y<h-1; y++) { a.push(y*w, y*w+w-1); }
    return a;
  };

  launcher.addEventListener("click", () => panel.classList.toggle("sme-open"));
  panel.querySelector(".sme-close").addEventListener("click", () => panel.classList.remove("sme-open"));
  tolerance.addEventListener("input", () => tolValue.textContent = tolerance.value);
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    imageName = file.name.replace(/\.[^.]+$/, "") || "costume";
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSide = 3000;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      original = ctx.getImageData(0,0,canvas.width,canvas.height);
      draw(original);
      setStatus(`Loaded ${canvas.width} × ${canvas.height}. Choose “Remove edge background” or click a background tile with “Pick a background area”.`);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setStatus("Could not read that image. Try PNG, JPG or WebP."); URL.revokeObjectURL(url); };
    img.src = url;
  });

  panel.querySelector("#sme-auto").addEventListener("click", () => {
    if (!original) return;
    const copy = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);
    const seeds = allBorderIndices(copy.width, copy.height);
    const result = removeFromSeeds(copy, seeds, Number(tolerance.value), panel.querySelector("#sme-eight").checked);
    draw(result.imageData);
    setStatus("Edge-connected background removed. Inspect the preview carefully; lower tolerance if parts of the artwork disappeared, or use Reset to try again.");
  });
  panel.querySelector("#sme-pick").addEventListener("click", () => {
    if (!original) return;
    picking = !picking;
    canvas.classList.toggle("sme-picking", picking);
    panel.querySelector("#sme-pick").textContent = picking ? "Click a background pixel…" : "Pick a background area";
    setStatus(picking ? "Click one checkerboard tile or background area in the preview. Only its connected region will be selected." : "Selection mode closed.");
  });
  canvas.addEventListener("click", ev => {
    if (!picking || !original) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width-1, Math.floor((ev.clientX-rect.left) * canvas.width / rect.width)));
    const y = Math.max(0, Math.min(canvas.height-1, Math.floor((ev.clientY-rect.top) * canvas.height / rect.height)));
    const copy = new ImageData(new Uint8ClampedArray(current.data), current.width, current.height);
    const result = removeFromSeeds(copy, [y*canvas.width+x], Number(tolerance.value), panel.querySelector("#sme-eight").checked);
    draw(result.imageData);
    picking = false;
    canvas.classList.remove("sme-picking");
    panel.querySelector("#sme-pick").textContent = "Pick a background area";
    setStatus("Connected region removed. Use Reset to restore the original and try another tolerance or region.");
  });
  panel.querySelector("#sme-reset").addEventListener("click", () => {
    if (original) { draw(original); setStatus("Original image restored."); }
  });
  panel.querySelector("#sme-download").addEventListener("click", () => {
    if (!current) return;
    const out = document.createElement("canvas");
    out.width = current.width; out.height = current.height;
    out.getContext("2d").putImageData(current,0,0);
    out.toBlob(blob => {
      if (!blob) { setStatus("PNG export failed. Please try again."); return; }
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url; a.download = `${imageName}-transparent.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus("Transparent PNG exported. In Scratch, choose Costumes → Upload Costume.");
    }, "image/png");
  });
})();

(() => {
  'use strict';
  if (window.__SVS_LOADED__) return;
  window.__SVS_LOADED__ = true;

  const STORE = 'svs-project-layouts-v07';
  const PREVIOUS = 'svs-project-layouts-v06';
  const LEGACY = 'svs-project-layouts-v05';
  const OLDER = 'svs-project-layouts-v04';
  const OLDEST = 'svs-project-layouts-v03';
  const OLDER2 = 'svs-project-layouts-v02';
  const S = { vm: null, vars: [], designs: [], active: null, panel: null, monitorHosts: new Set(), lastScan: 0, lastStyle: 0, lastSave: 0, editorMessage: null, editorCleanup: null };

  const el = (tag, attrs = {}, parent) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v;
      else if (k === 'style') Object.assign(n.style, v);
      else if (k === 'class') n.className = v;
      else if (k === 'value') n.value = v;
      else if (k === 'checked') n.checked = !!v;
      else if (k === 'disabled') n.disabled = !!v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, String(v));
    }
    if (parent) parent.append(n);
    return n;
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const css = `
  #svs-root{position:fixed;z-index:9999999;right:14px;top:74px;font:13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;color:#25233a}
  #svs-toggle{background:#7653d6;color:#fff;border:0;border-radius:9px;padding:10px 14px;font-weight:750;cursor:pointer;box-shadow:0 3px 12px #0004}
  #svs-panel{display:none;width:min(1480px,98vw);height:min(920px,92vh);overflow:auto;margin-top:7px;padding:14px;background:#f7f7fb;border:1px solid #d9d7e3;border-radius:12px;box-shadow:0 12px 40px #0008;box-sizing:border-box;color:#26243a}
  #svs-panel.open{display:block}.svs-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.svs-title{font-size:19px;font-weight:850}.svs-sub{color:#77748a;font-size:11px;margin-top:3px}
  .svs-btn{border:0;border-radius:6px;padding:7px 10px;background:#7956db;color:#fff;font-weight:650;cursor:pointer;margin:3px 2px 3px 0}.svs-btn.alt{background:#e9e6f3;color:#49445d}.svs-btn.danger{background:#d95370;color:#fff}.svs-btn:disabled{opacity:.42;cursor:not-allowed}
  .svs-box{background:#fff;border:1px solid #e1dfeb;border-radius:8px;padding:9px;min-width:0;box-sizing:border-box}.svs-box h3{font-size:12px;margin:0 0 8px}.svs-muted,.svs-hint{color:#77748a;font-size:11px}.svs-small{font-size:10px;color:#77748a}.svs-label{display:block;font-size:11px;color:#57536b;margin:6px 0 3px}
  .svs-input,.svs-select,.svs-code{box-sizing:border-box;width:100%;padding:7px;margin:2px 0 5px;border:1px solid #d1cedd;border-radius:6px;background:#fff;color:#28253b;min-width:0}.svs-row{display:flex;gap:6px;align-items:center}.svs-row>*{min-width:0;flex:1}.svs-check{display:flex;gap:6px;align-items:center;margin:6px 0;font-size:11px;color:#49445d}.svs-sep{border:0;border-top:1px solid #e8e6ee;margin:9px 0}
  .svs-editor-grid{display:grid;grid-template-columns:54px minmax(440px,1fr) 255px;gap:9px;margin-top:9px;align-items:stretch}.svs-layer{padding:7px;margin:5px 0;background:#faf9fd;border:1px solid #e3e0ec;border-radius:6px;cursor:pointer;color:#38344d}.svs-layer.active{border-color:#9479ed;background:#f0ecff}.svs-workspace{height:min(58vh,590px);min-height:390px;display:flex;align-items:center;justify-content:center;overflow:auto;position:relative;border:1px solid #d8d6e2;border-radius:5px;background-color:#fff;background-image:linear-gradient(45deg,#e5e8ef 25%,transparent 25%),linear-gradient(-45deg,#e5e8ef 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e8ef 75%),linear-gradient(-45deg,transparent 75%,#e5e8ef 75%);background-size:22px 22px;background-position:0 0,0 11px,11px -11px,-11px 0}
  .svs-artboard{position:relative;flex:none;border:1px dashed #a98af3;background:transparent;overflow:visible;box-shadow:0 0 0 1px #0001}.svs-artboard:after{content:'costume bounds';position:absolute;left:4px;top:3px;color:#8b83a1;font-size:9px;pointer-events:none}.svs-part{position:absolute;left:50%;top:50%;z-index:2;object-fit:fill;user-select:none;cursor:move;transform-origin:center;max-width:none;max-height:none}.svs-part.selected{outline:1px dashed #7956db;outline-offset:2px}.svs-drawcanvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;z-index:100}
  .svs-code{min-height:205px;resize:vertical;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre;tab-size:2}.svs-code-panel{margin-top:9px}.svs-toolbar{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.svs-status{min-height:16px;color:#77748a;font-size:11px;margin-top:5px}.svs-preview-note{margin-top:6px;color:#77748a;font-size:10px}.svs-pill{display:inline-block;padding:2px 7px;border-radius:999px;background:#eee9ff;color:#6245b4;font-size:10px}
  .svs-paint-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #e1dfeb;border-radius:8px;padding:7px;margin-top:9px}.svs-toolbar-group{display:flex;gap:5px;align-items:center;padding-right:8px;border-right:1px solid #e7e5ed}.svs-toolbar-group:last-child{border:0}.svs-toolbar-group label{font-size:11px;color:#5b566e}.svs-toolrail{display:flex;flex-direction:column;gap:5px;align-items:center;background:#fff;border:1px solid #e1dfeb;border-radius:8px;padding:6px}.svs-tool{width:40px;height:40px;border:0;border-radius:6px;background:transparent;color:#5a5870;font-size:19px;cursor:pointer}.svs-tool.active{background:#7956db;color:white}.svs-tool:hover{background:#eee9ff}.svs-canvaspane{min-width:0;background:#fff;border:1px solid #e1dfeb;border-radius:8px;padding:8px}.svs-canvaspane h3{display:none}.svs-sidebar{max-height:calc(58vh + 55px);overflow:auto;background:#fff;border:1px solid #e1dfeb;border-radius:8px;padding:9px}.svs-sidebar h3{font-size:12px;margin:0 0 7px}.svs-side-section{margin-bottom:10px}.svs-monitor-health{border:1px solid #e1dfeb;background:#fff;border-radius:7px;padding:8px;margin-top:9px;font-size:11px;color:#57536b}.svs-onion-skin{position:absolute!important;z-index:1!important;pointer-events:none!important;transform-origin:center center!important;filter:grayscale(.25)!important;display:block!important;visibility:visible!important}.svs-readout-preview{position:absolute;z-index:500;pointer-events:none;white-space:pre;line-height:1;font-weight:700}.svs-text-input{width:min(260px,45vw);padding:6px;border:1px solid #cfcada;border-radius:6px}.svs-drawcanvas{z-index:100!important}
  /* Keep Scratch's original draggable monitor as the host, but replace its visible contents with the SVS artwork. */
  .svs-monitor-host{background-color:transparent!important;background-repeat:no-repeat!important;background-size:100% 100%!important;background-position:center!important;border:0!important;border-radius:0!important;box-shadow:none!important}
  .svs-monitor-host>*{visibility:hidden!important}
  .svs-monitor-host *{visibility:hidden!important}
  @media(max-width:900px){#svs-panel{width:96vw}.svs-editor-grid{grid-template-columns:48px minmax(280px,1fr)}.svs-sidebar{grid-column:1/-1;max-height:280px}.svs-workspace{height:430px;min-height:300px}}
  `;
  el('style', { text: css }, document.documentElement);

  function findVM() {
    if (window.vm?.runtime?.targets) return window.vm;
    if (window.Scratch?.vm?.runtime?.targets) return window.Scratch.vm;
    const nodes = [...document.querySelectorAll('[class*=stage],[class*=monitor],[class*=gui]')].slice(0, 600);
    for (const node of nodes) for (const key of Object.getOwnPropertyNames(node)) {
      if (!key.startsWith('__react')) continue;
      let f = node[key], depth = 0;
      while (f && depth++ < 24) {
        const p = f.memoizedProps || f.pendingProps || f;
        const vm = p.vm || p.value?.vm || p.store?.getState?.()?.scratchGui?.vm;
        if (vm?.runtime?.targets) return vm;
        f = f.return || f._owner;
      }
    }
    return null;
  }
  function scan() {
    S.vm = findVM();
    const found = new Map();
    for (const t of S.vm?.runtime?.targets || []) for (const v of Object.values(t.variables || {})) {
      const key = `${v.id}|${t.isStage ? 'stage' : t.id}`;
      found.set(key, { key, id: v.id, name: v.name, value: v.value, targetId: t.id, isStage: !!t.isStage, target: t.isStage ? 'Stage' : t.sprite?.name || t.getName?.() || 'Sprite' });
    }
    S.vars = [...found.values()];
    return S.vars;
  }
  function getVariable(d) {
    if (!d) return null;
    const owner = String(d.variableKey || '').split('|').slice(1).join('|');
    const target = S.vm?.runtime?.targets?.find(t => owner === 'stage' ? t.isStage : t.id === owner);
    if (target?.variables?.[d.variableId]) return target.variables[d.variableId];
    for (const t of S.vm?.runtime?.targets || []) if (t.variables?.[d.variableId]) return t.variables[d.variableId];
    return null;
  }

  function save() {
    try {
      const raw = JSON.stringify(S.designs);
      if (raw.length > 4_400_000) throw new Error('Your designs exceed the browser storage allowance. Reduce image sizes or remove unused layers.');
      localStorage.setItem(STORE, raw);
      S.lastSave = Date.now();
      return true;
    } catch (e) {
      alert(`SVS could not save: ${e.message || 'browser storage is full'}`);
      return false;
    }
  }
  function load() {
    try {
      let data = localStorage.getItem(STORE) || localStorage.getItem(PREVIOUS) || localStorage.getItem(LEGACY) || localStorage.getItem(OLDER) || localStorage.getItem(OLDEST) || localStorage.getItem(OLDER2);
      const arr = JSON.parse(data || '[]');
      S.designs = Array.isArray(arr) ? arr.map(d => ({
        ...d,
        stage: false, monitor: true,
        showValue: d.showValue !== false, valuePosition: d.valuePosition || 'bottom-center', valueX: num(d.valueX, num(d.artW, 180) / 2), valueY: num(d.valueY, num(d.artH, 90) - 12), valueSize: num(d.valueSize, 16), valueColor: d.valueColor || '#ffffff', valueOutline: d.valueOutline || '#111111', showOnionSkin: d.showOnionSkin !== false, onionOpacity: clamp(num(d.onionOpacity, 35), 30, 80),
        artW: num(d.artW, 180), artH: num(d.artH, 90),
        parts: (d.parts || []).map(p => ({ type: p.type || 'image', visible: p.visible !== false, ...p, x: num(p.x, 0), y: num(p.y, 0), width: num(p.width, 180), height: num(p.height, 120), rotation: num(p.rotation, 0), scale: num(p.scale, 100), opacity: num(p.opacity, 100), rules: p.rules || {} }))
      })) : [];
    } catch { S.designs = []; }
  }
  function mapValue(value, rule) {
    const a = num(rule.min, 0), b = num(rule.max, 100), lo = num(rule.from, 0), hi = num(rule.to, 100), n = Number(value);
    if (!Number.isFinite(n) || a === b) return lo;
    let f = (n - a) / (b - a);
    if (rule.clamp !== false) f = clamp(f, 0, 1);
    return lo + f * (hi - lo);
  }
  function contextFor(d, value, previous, elapsed) {
    const min = num(d.programMin, 0), max = num(d.programMax, 100), n = Number(value);
    return { value: Number.isFinite(n) ? n : 0, previousValue: num(previous, 0), delta: num(value, 0) - num(previous, 0), elapsed, min, max, clamp, abs: Math.abs, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, PI: Math.PI };
  }
  const compiled = new Map();
  function compileProgram(d) {
    const key = d.id, signature = `${d.language}|${d.programCode || ''}|${d.programTarget || ''}|${d.programProperty || ''}`;
    if (compiled.get(key)?.signature === signature) return compiled.get(key).fn;
    let fn;
    if (d.language === 'cstyle') {
      let body = String(d.programCode || '').replace(/^\s*#include[^\n]*$/gm, '');
      body = body.replace(/\b(?:const\s+)?(?:double|float|int|long|short)\s+/g, 'let ');
      body = body.replace(/\bbool\s+/g, 'let ').replace(/\bNULL\b/g, 'null');
      if (!/\breturn\b/.test(body)) body = `return (${body});`;
      fn = new Function('ctx', `"use strict"; const {value,previousValue,delta,elapsed,min,max,clamp,abs,sqrt,sin,cos,tan,PI}=ctx; ${body}`);
    } else {
      const body = String(d.programCode || '');
      fn = new Function('ctx', `"use strict"; const {value,previousValue,delta,elapsed,min,max,clamp,abs,sqrt,sin,cos,tan,PI}=ctx; ${body}`);
    }
    compiled.set(key, { signature, fn });
    return fn;
  }
  function runProgram(d, value, previous, elapsed) {
    if (!d.programmable) return null;
    try {
      const result = compileProgram(d)(contextFor(d, value, previous, elapsed));
      d._programError = '';
      if (d.language === 'cstyle') {
        const n = Number(result);
        if (!Number.isFinite(n)) throw new Error('C-style mode must return one number.');
        const out = { parts: [] };
        const idx = Math.max(0, (d.parts || []).findIndex(p => p.id === d.programTarget));
        out.parts[idx] = { [d.programProperty || 'rotation']: n };
        return out;
      }
      if (result == null || typeof result !== 'object') throw new Error('JavaScript must return an object. See the example in the editor.');
      return result;
    } catch (e) {
      d._programError = e.message || String(e);
      return null;
    }
  }
  function partTransform(part, value, programOverride) {
    const rules = part.rules || {}, o = programOverride || {};
    const get = (name, fallback) => Number.isFinite(Number(o[name])) ? Number(o[name]) : rules[name] ? mapValue(value, rules[name]) : fallback;
    return { x: get('x', num(part.x, 0)), y: get('y', num(part.y, 0)), rotation: get('rotation', num(part.rotation, 0)), scale: get('scale', num(part.scale, 100)), opacity: get('opacity', num(part.opacity, 100)) };
  }
  function setPartStyle(node, part, value, programOverride, scale = 1, stage = false) {
    const t = partTransform(part, value, programOverride);
    node.style.left = `calc(50% + ${t.x * scale}px)`;
    node.style.top = `calc(50% + ${t.y * scale}px)`;
    node.style.width = `${Math.max(1, num(part.width, 180) * scale)}px`;
    node.style.height = `${Math.max(1, num(part.height, 120) * scale)}px`;
    node.style.opacity = String(clamp(t.opacity / 100, 0, 1));
    node.style.transform = `translate(-50%,-50%) rotate(${t.rotation}deg) scale(${t.scale / 100})`;
    node.style.display = part.visible === false ? 'none' : '';
  }

  function monitorNodes() {
    // Scratch renders its existing variable monitor through MonitorComponent -> Draggable -> Box.
    // CSS-module hashes vary, but the monitor-container fragment is stable across builds.
    const candidates = [...document.querySelectorAll('[class*="monitor-container"], [class*="monitorContainer"]')]
      .filter(n => !n.closest('#svs-root'));
    return candidates.filter(n => {
      const info = getReactMonitorInfo(n);
      return !!(info.id || info.label || info.mode || n.querySelector('[class*="label"],[class*="value"]'));
    });
  }

  function getMonitorRecord(id) {
    if (!id) return null;
    const state = S.vm?.runtime?._monitorState;
    try {
      const record = state?.get?.(id);
      if (!record) return null;
      return typeof record.toJS === 'function' ? record.toJS() : record;
    } catch { return null; }
  }

  function getReactMonitorInfo(node) {
    const info = { id: null, label: null, targetId: null, mode: null, opcode: null, spriteName: null, params: null, record: null };
    const candidates = [];
    // React attaches these private pointers to host nodes. Use property names because
    // some React versions define them as non-enumerable.
    for (const key of Object.getOwnPropertyNames(node)) {
      if (key.startsWith('__reactProps$')) {
        const p = node[key];
        if (p && typeof p === 'object') candidates.push(p);
      }
    }
    let fiber = null;
    for (const key of Object.getOwnPropertyNames(node)) if (key.startsWith('__reactFiber$')) { fiber = node[key]; break; }
    let depth = 0;
    while (fiber && depth++ < 60) {
      const p = fiber.memoizedProps || fiber.pendingProps;
      if (p && typeof p === 'object') candidates.push(p);
      fiber = fiber.return;
    }

    // Prefer MonitorComponent props, which have label + mode + monitor id.
    const monitorProps = candidates.find(p => typeof p.label === 'string' && (p.mode != null || p.id != null));
    const parentProps = candidates.find(p => p && p.id != null && p.opcode === 'data_variable');
    const source = monitorProps || candidates.find(p => typeof p.label === 'string') || {};
    info.id = source.id ?? parentProps?.id ?? null;
    info.label = source.label ?? null;
    info.mode = source.mode ?? null;
    info.targetId = source.targetId ?? parentProps?.targetId ?? null;
    info.opcode = source.opcode ?? parentProps?.opcode ?? null;
    info.spriteName = source.spriteName ?? parentProps?.spriteName ?? null;
    info.params = source.params ?? parentProps?.params ?? null;
    info.record = getMonitorRecord(info.id);

    // Immutable VM monitor state is the best source for opcode/target identity.
    if (info.record) {
      info.opcode = info.record.opcode ?? info.opcode;
      info.targetId = info.record.targetId ?? info.targetId;
      info.params = info.record.params ?? info.params;
      info.spriteName = info.record.spriteName ?? info.spriteName;
      info.mode = info.record.mode ?? info.mode;
    }
    return info;
  }

  function monitorLabel(node, info) {
    if (typeof info.label === 'string' && info.label.trim()) return info.label.trim();
    const label = node.querySelector('[class*="monitor_label"], [class*="monitor-label"], [class*="label_"]');
    return label?.textContent?.trim() || '';
  }

  function monitorMatches(node, d) {
    const info = getReactMonitorInfo(node);
    const record = info.record;
    if (info.mode === 'list' || record?.opcode === 'data_listcontents' || (info.opcode && info.opcode !== 'data_variable')) return false;
    // Scratch VM uses the variable ID as the monitor ID for data_variable monitors.
    // This is the strongest match and avoids translated labels or duplicate variable names.
    if (info.id && String(info.id) === String(d.variableId)) return true;
    // An explicit monitor ID selected in the editor always means that exact Scratch monitor.
    if (d.monitorBlockId) return !!info.id && String(info.id) === String(d.monitorBlockId);

    const ownerId = String(d.variableKey || '').split('|').slice(1).join('|');
    const target = S.vm?.runtime?.targets?.find(t => ownerId === 'stage' ? t.isStage : t.id === ownerId);
    if (!target) return false;
    const label = monitorLabel(node, info).trim();
    const targetName = target.isStage ? 'Stage' : (target.sprite?.name || target.getName?.() || d.target);
    const expected = target.isStage ? d.variableName : (targetName + ': ' + d.variableName);
    const norm = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
    if (norm(label) !== norm(d.variableName) && norm(label) !== norm(expected)) return false;

    // When the monitor state exposes a target ID, use that canonical owner instead of
    // inherited React props that may belong to a parent component.
    const monitorTargetId = record?.targetId ?? info.targetId;
    if (monitorTargetId && monitorTargetId !== target.id) return false;
    if (info.spriteName && targetName !== info.spriteName) return false;
    return true;
  }

  function findOriginalMonitorNode(d) {
    for (const node of monitorNodes()) if (monitorMatches(node, d)) return node;
    return null;
  }

  function valueLayout(d) {
    const w = num(d.artW, 180), h = num(d.artH, 90), size = clamp(num(d.valueSize, 16), 8, 64);
    const m = Math.max(3, size * 0.35);
    const p = d.valuePosition || 'bottom-center';
    const map = {
      'top-left': { x: m, y: size * 0.7, anchor: 'start' },
      'top-center': { x: w / 2, y: size * 0.7, anchor: 'middle' },
      'top-right': { x: w - m, y: size * 0.7, anchor: 'end' },
      'middle-left': { x: m, y: h / 2, anchor: 'start' },
      'center': { x: w / 2, y: h / 2, anchor: 'middle' },
      'middle-right': { x: w - m, y: h / 2, anchor: 'end' },
      'bottom-left': { x: m, y: h - size * 0.35, anchor: 'start' },
      'bottom-center': { x: w / 2, y: h - size * 0.35, anchor: 'middle' },
      'bottom-right': { x: w - m, y: h - size * 0.35, anchor: 'end' }
    };
    const pos = map[p] || { x: num(d.valueX, w / 2), y: num(d.valueY, h - 12), anchor: 'middle' };
    if (p === 'custom') {
      pos.x = clamp(num(d.valueX, w / 2), -2000, 4000);
      pos.y = clamp(num(d.valueY, h - 12), -2000, 4000);
    }
    return { ...pos, size };
  }

  function makeOnionSkin(d, scale) {
    const source = findOriginalMonitorNode(d);
    if (!source) return null;
    const state = source.__svsMonitorState;
    // Use the exact DOM snapshot captured before SVS hid the native monitor.
    const reference = state?.originalMarkup || source;
    const ghost = reference.cloneNode(true);
    ghost.classList.remove('svs-monitor-host');
    ghost.classList.add('svs-onion-skin');
    ghost.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    ghost.removeAttribute('id');
    // A clone is only a visual reference: remove transient controls and interactive semantics.
    ghost.querySelectorAll('input,button,textarea,select').forEach(n => n.remove());
    ghost.querySelectorAll('*').forEach(n => {
      n.style.setProperty('visibility', 'visible', 'important');
      n.style.setProperty('pointer-events', 'none', 'important');
    });
    const rect = state?.originalRect || source.getBoundingClientRect();
    const width = Math.max(24, num(rect.width, source.offsetWidth || 64));
    const height = Math.max(18, num(rect.height, source.offsetHeight || 24));
    ghost.style.setProperty('position', 'absolute', 'important');
    ghost.style.setProperty('left', '50%', 'important');
    ghost.style.setProperty('top', '50%', 'important');
    ghost.style.setProperty('width', width + 'px', 'important');
    ghost.style.setProperty('height', height + 'px', 'important');
    ghost.style.setProperty('min-width', '0', 'important');
    ghost.style.setProperty('min-height', '0', 'important');
    ghost.style.setProperty('max-width', 'none', 'important');
    ghost.style.setProperty('max-height', 'none', 'important');
    ghost.style.setProperty('box-sizing', 'border-box', 'important');
    ghost.style.setProperty('margin', '0', 'important');
    ghost.style.setProperty('opacity', String(clamp(num(d.onionOpacity, 35), 30, 80) / 100), 'important');
    ghost.style.setProperty('visibility', 'visible', 'important');
    ghost.style.setProperty('display', 'block', 'important');
    ghost.style.setProperty('transform', 'translate(-50%,-50%) scale(' + scale + ')', 'important');
    ghost.style.setProperty('transform-origin', 'center center', 'important');
    ghost.style.setProperty('z-index', '1', 'important');
    ghost.style.setProperty('filter', 'grayscale(.25)', 'important');
    ghost.style.setProperty('pointer-events', 'none', 'important');
    ghost.setAttribute('aria-hidden', 'true');
    return ghost;
  }

  function restoreMonitor(node) {
    const state = node.__svsMonitorState;
    if (!state) return;
    node.classList.remove('svs-monitor-host');
    for (const [prop, value] of Object.entries(state.originalStyle || {})) node.style[prop] = value;
    delete node.__svsMonitorState;
  }

  function ensureMonitorCostume(node, d) {
    let state = node.__svsMonitorState;
    if (!state) {
      const nativeRect = node.getBoundingClientRect();
      state = {
        // A true pre-SVS clone, not a clone of the already-hidden/rewritten monitor.
        originalMarkup: node.cloneNode(true),
        originalRect: { width: nativeRect.width || node.offsetWidth || 64, height: nativeRect.height || node.offsetHeight || 24 },
        originalStyle: {
          display: node.style.display, width: node.style.width, height: node.style.height, minWidth: node.style.minWidth,
          minHeight: node.style.minHeight, overflow: node.style.overflow,
          padding: node.style.padding, boxSizing: node.style.boxSizing,
          background: node.style.background, backgroundColor: node.style.backgroundColor,
          backgroundImage: node.style.backgroundImage, backgroundSize: node.style.backgroundSize,
          backgroundRepeat: node.style.backgroundRepeat, backgroundPosition: node.style.backgroundPosition, border: node.style.border, borderRadius: node.style.borderRadius, boxShadow: node.style.boxShadow
        }, designId: null, previousValue: undefined, lastTime: null, lastSVG: ''
      };
      node.__svsMonitorState = state;
    }

    // The native Scratch monitor element itself remains the display, drag target and position anchor.
    node.classList.add('svs-monitor-host');
    node.style.display = 'block';
    node.style.minWidth = '0';
    node.style.minHeight = '0';
    node.style.overflow = 'visible';
    node.style.padding = '0';
    node.style.boxSizing = 'border-box';
    node.style.backgroundColor = 'transparent';
    node.style.backgroundRepeat = 'no-repeat';
    node.style.backgroundSize = '100% 100%';
    node.style.backgroundPosition = 'center';
    node.style.border = '0';
    node.style.borderRadius = '0';
    node.style.boxShadow = 'none';
    state.designId = d.id;
    return state;
  }

  function svgEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function base64UTF8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }

  function renderMonitorSVG(d, value, overrides) {
    const artW = clamp(num(d.artW, 180), 40, 1400);
    const artH = clamp(num(d.artH, 90), 40, 1400);
    const geometry = [];
    let minX = 0, minY = 0, maxX = artW, maxY = artH;

    for (let i = 0; i < (d.parts || []).length; i++) {
      const p = d.parts[i];
      if (p.visible === false) continue;
      const t = partTransform(p, value, overrides?.[i]);
      const w = Math.max(1, num(p.width, 180)) * Math.max(0.01, t.scale / 100);
      const h = Math.max(1, num(p.height, 120)) * Math.max(0.01, t.scale / 100);
      const cx = artW / 2 + t.x, cy = artH / 2 + t.y;
      const rad = t.rotation * Math.PI / 180;
      const hx = Math.abs(w * Math.cos(rad)) / 2 + Math.abs(h * Math.sin(rad)) / 2;
      const hy = Math.abs(w * Math.sin(rad)) / 2 + Math.abs(h * Math.cos(rad)) / 2;
      minX = Math.min(minX, cx - hx); minY = Math.min(minY, cy - hy);
      maxX = Math.max(maxX, cx + hx); maxY = Math.max(maxY, cy + hy);
      geometry.push({ p, t, cx, cy, w, h });
    }

    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));
    const body = geometry.map(({ p, t, cx, cy, w, h }) =>
      `<image href="${svgEscape(p.src)}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" opacity="${clamp(t.opacity / 100, 0, 1)}" preserveAspectRatio="none" transform="translate(${cx} ${cy}) rotate(${t.rotation}) scale(${p.flipX ? -1 : 1} ${p.flipY ? -1 : 1}) translate(${-cx} ${-cy})"/>`
    ).join('');
    let readout = '';
    if (d.showValue !== false) {
      const text = svgEscape(value);
      const pos = valueLayout(d);
      readout = `<text x="${pos.x}" y="${pos.y}" text-anchor="${pos.anchor}" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${pos.size}" font-weight="700" fill="${svgEscape(d.valueColor || '#ffffff')}" stroke="${svgEscape(d.valueOutline || '#111111')}" stroke-width="${Math.max(0, pos.size * 0.09)}" paint-order="stroke">${text}</text>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">${body}${readout}</svg>`;
    return { width, height, image: `url("data:image/svg+xml;base64,${base64UTF8(svg)}")` };
  }

  function styleMonitors() {
    const activeHosts = new Set();
    const nodes = monitorNodes();
    for (const d of S.designs.filter(x => x.monitor !== false)) {
      if (!getVariable(d)) continue;
      for (const node of nodes) {
        if (!monitorMatches(node, d)) continue;
        activeHosts.add(node);
        ensureMonitorCostume(node, d);
      }
    }
    for (const node of [...S.monitorHosts]) {
      if (!activeHosts.has(node) || !node.isConnected) {
        restoreMonitor(node);
        S.monitorHosts.delete(node);
      }
    }
    for (const node of activeHosts) S.monitorHosts.add(node);
  }

  function renderMonitors(now) {
    for (const node of [...S.monitorHosts]) {
      const state = node.__svsMonitorState;
      const d = S.designs.find(x => x.id === state?.designId);
      const v = d && getVariable(d);
      if (!state || !d || !v) continue;
      const elapsed = state.lastTime == null ? 0 : Math.max(0, (now - state.lastTime) / 1000);
      const result = runProgram(d, v.value, state.previousValue, elapsed);
      const overrides = result?.parts || [];
      const output = renderMonitorSVG(d, result?.text != null ? result.text : v.value, overrides);
      if (state.lastSVG !== output.image || node.style.backgroundImage !== output.image || parseFloat(node.style.width) !== output.width || parseFloat(node.style.height) !== output.height) {
        node.style.width = String(output.width) + 'px';
        node.style.height = String(output.height) + 'px';
        node.style.backgroundImage = output.image;
        node.style.backgroundRepeat = 'no-repeat';
        node.style.backgroundSize = '100% 100%';
        node.style.backgroundPosition = 'center';
        node.style.backgroundColor = 'transparent';
        node.style.border = '0';
        node.style.borderRadius = '0';
        node.style.boxShadow = 'none';
        state.lastSVG = output.image;
      }
      state.previousValue = v.value;
      state.lastTime = now;
    }
  }

  function fileData(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error || new Error('Could not read image')); r.readAsDataURL(file);
    });
  }
  async function importImage(file) {
    if (!file || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error('Use PNG, JPEG, WebP or SVG. PNG with transparency is fully supported.');
    if (file.size > 2 * 1024 * 1024) throw new Error('Please keep each image below 2 MB to avoid browser storage limits.');
    if (file.type === 'image/svg+xml') {
      const t = await file.text();
      if (/<\s*script|foreignObject|on[a-z]+\s*=|javascript:|<\s*iframe|<\s*object|<\s*embed/i.test(t) || /(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:text\/html)/i.test(t)) throw new Error('This SVG contains active or external content. Please use a safe, self-contained SVG.');
    }
    const src = await fileData(file);
    const img = new Image(); img.src = src;
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('The image could not be decoded.')); });
    if (img.naturalWidth > 4096 || img.naturalHeight > 4096) throw new Error('Image dimensions must be 4096 × 4096 or smaller.');
    return { src, width: img.naturalWidth, height: img.naturalHeight };
  }

  function renderList() {
    const list = S.panel.querySelector('.svs-designs'); if (!list) return;
    list.replaceChildren();
    if (!S.designs.length) el('div', { class: 'svs-small', text: 'No variable costumes yet. Create one to start building.' }, list);
    for (const d of S.designs) {
      const c = el('div', { class: 'svs-layer' }, list);
      el('strong', { text: d.name || d.variableName || 'Untitled costume' }, c);
      el('div', { class: 'svs-small', text: `${d.variableName || 'Unlinked'} · ${(d.parts || []).length} layers · Original Scratch monitor` }, c);
      el('button', { class: 'svs-btn alt', text: 'Open editor', onclick: () => editor(d) }, c);
      el('button', { class: 'svs-btn danger', text: 'Delete', onclick: () => { S.designs = S.designs.filter(x => x.id !== d.id); compiled.delete(d.id); save(); renderList(); styleMonitors(); renderMonitors(performance.now()); } }, c);
    }
  }

  function editor(existing) {
    if (S.editorCleanup) { S.editorCleanup(); S.editorCleanup = null; }
    const panel = S.panel; panel.querySelector('.svs-editor')?.remove();
    scan();
    const box = el('div', { class: 'svs-box svs-editor', style: { marginTop: '10px' } }, panel);
    el('h3', { text: existing ? 'Variable costume editor · edit' : 'Variable costume editor · create' }, box);
    const design = existing ? clone(existing) : { id: crypto.randomUUID(), parts: [], stage: false, monitor: true, showValue: true, valuePosition: 'bottom-center', valueX: 90, valueY: 78, valueSize: 16, valueColor: '#ffffff', valueOutline: '#111111', showOnionSkin: true, onionOpacity: 35, artW: 180, artH: 90, programmable: false, language: 'javascript', programMin: 0, programMax: 100, programCode: `const ratio = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);\nreturn {\n  // Parts are ordered exactly like the Layers list.\n  parts: [\n    { rotation: -135 + ratio * 270 }\n  ],\n  text: Math.round(value)\n};` };
    design.parts ||= [];
    const top = el('div', { class: 'svs-row' }, box);
    const variable = el('select', { class: 'svs-select' }, top);
    if (!S.vars.length) el('option', { value: '', text: 'Scratch variables not detected — open a project' }, variable);
    for (const v of S.vars) el('option', { value: v.key, text: `${v.name} — ${v.target}` }, variable);
    if (design.variableKey) variable.value = design.variableKey;
    const syncSelectedVariable = () => {
      const v = S.vars.find(x => x.key === variable.value);
      if (v) Object.assign(design, { variableId: v.id, variableKey: v.key, variableName: v.name, targetId: v.targetId, target: v.target });
      drawPreview();
    };
    variable.addEventListener('change', syncSelectedVariable);
    const initialVariable = S.vars.find(x => x.key === variable.value);
    if (initialVariable) Object.assign(design, { variableId: initialVariable.id, variableKey: initialVariable.key, variableName: initialVariable.name, targetId: initialVariable.targetId, target: initialVariable.target });
    const name = el('input', { class: 'svs-input', value: design.name || '', placeholder: 'Costume name' }, top);
    const monitorBindRow = el('div', { class: 'svs-row', style: { marginTop: '5px' } }, box);
    const monitorBind = el('select', { class: 'svs-select', title: 'Bind this costume to an existing Scratch variable monitor' }, monitorBindRow);
    function refreshMonitorChoices() {
      const keep = design.monitorBlockId || '';
      monitorBind.replaceChildren();
      el('option', { value: '', text: 'Automatically match existing variable monitor' }, monitorBind);
      const seen = new Set();
      for (const node of monitorNodes()) {
        const info = getReactMonitorInfo(node);
        const id = info.id == null ? '' : String(info.id);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const label = monitorLabel(node, info) || 'Unnamed monitor';
        const tail = info.targetId ? String(info.targetId).slice(0, 8) : 'target unknown';
        el('option', { value: id, text: label + ' · ' + tail }, monitorBind);
      }
      monitorBind.value = keep;
    }
    refreshMonitorChoices();
    const refreshMonitors = el('button', { class: 'svs-btn alt', text: '↻', title: 'Refresh visible Scratch monitor list' }, monitorBindRow);
    refreshMonitors.addEventListener('click', () => { refreshMonitorChoices(); scan(); styleMonitors(); drawPreview(); });
    monitorBind.addEventListener('change', () => { design.monitorBlockId = monitorBind.value || null; });
    const dims = el('div', { class: 'svs-row' }, box);
    const aw = el('input', { class: 'svs-input', type: 'number', min: 40, max: 1400, value: design.artW, title: 'Costume width' }, dims);
    const ah = el('input', { class: 'svs-input', type: 'number', min: 40, max: 1400, value: design.artH, title: 'Costume height' }, dims);
    el('div', { class: 'svs-hint', text: 'Costume width × height. Components may extend beyond the dashed bounds. The original Scratch variable monitor remains the draggable base object.' }, box);

    const paintBar = el('div', { class: 'svs-paint-toolbar' }, box);
    const colorGroup = el('div', { class: 'svs-toolbar-group' }, paintBar);
    el('label', { text: 'Fill' }, colorGroup);
    const fillColor = el('input', { type: 'color', value: '#7956db', class: 'svs-input', style: { width: '44px', padding: '2px', height: '30px', margin: '0' }, title: 'Brush and shape fill' }, colorGroup);
    el('label', { text: 'Outline' }, colorGroup);
    const outlineColor = el('input', { type: 'color', value: '#171521', class: 'svs-input', style: { width: '44px', padding: '2px', height: '30px', margin: '0' }, title: 'Shape outline' }, colorGroup);
    const widthGroup = el('div', { class: 'svs-toolbar-group' }, paintBar);
    el('label', { text: 'Size' }, widthGroup);
    const brushSize = el('input', { class: 'svs-input', type: 'number', min: 1, max: 100, value: 4, style: { width: '58px', margin: '0' }, title: 'Brush / outline width' }, widthGroup);
    const historyGroup = el('div', { class: 'svs-toolbar-group' }, paintBar);
    const undoPaintBtn = el('button', { class: 'svs-btn alt', text: '↶ Undo vector', disabled: true, title: 'Remove the last drawn vector object' }, historyGroup);
    const redoPaintBtn = el('button', { class: 'svs-btn alt', text: '↷ Redo vector', disabled: true, title: 'Restore the last removed vector object' }, historyGroup);
    undoPaintBtn.addEventListener('click', () => undoObject());
    redoPaintBtn.addEventListener('click', () => redoObject());
    const editGroup = el('div', { class: 'svs-toolbar-group' }, paintBar);
    const copyBtn = el('button', { class: 'svs-btn alt', text: 'Copy' }, editGroup);
    const pasteBtn = el('button', { class: 'svs-btn alt', text: 'Paste', disabled: true }, editGroup);
    const deleteBtn = el('button', { class: 'svs-btn alt', text: 'Delete' }, editGroup);
    const transformGroup = el('div', { class: 'svs-toolbar-group' }, paintBar);
    const flipHBtn = el('button', { class: 'svs-btn alt', text: 'Flip H' }, transformGroup);
    const flipVBtn = el('button', { class: 'svs-btn alt', text: 'Flip V' }, transformGroup);
    const raiseBtn = el('button', { class: 'svs-btn alt', text: 'Forward' }, transformGroup);
    const lowerBtn = el('button', { class: 'svs-btn alt', text: 'Backward' }, transformGroup);

    const grid = el('div', { class: 'svs-editor-grid' }, box);
    const left = el('div', { class: 'svs-toolrail' }, grid);
    const center = el('div', { class: 'svs-canvaspane' }, grid);
    const right = el('div', { class: 'svs-sidebar' }, grid);
    const layerSection = el('div', { class: 'svs-side-section' }, right);
    el('h3', { text: 'Costume layers' }, layerSection);
    const layerList = el('div', {}, layerSection);
    const file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml', style: { display: 'none' } }, left);
    const makeTool = (glyph, label, action, active = false) => {
      const b = el('button', { class: 'svs-tool' + (active ? ' active' : ''), text: glyph, title: label, 'aria-label': label }, left);
      b.addEventListener('click', action); return b;
    };
    let editorTool = 'select';
    const toolButtons = {};
    const setEditorTool = tool => { editorTool = tool; for (const [key, b] of Object.entries(toolButtons)) b.classList.toggle('active', key === tool); if (drawing?.cvs) { drawing.cvs.style.pointerEvents = tool === 'select' ? 'none' : 'auto'; drawing.cvs.style.cursor = tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair'; } };
    toolButtons.select = makeTool('↖', 'Select / move layer', () => setEditorTool('select'), true);
    toolButtons.brush = makeTool('✎', 'Brush', () => { setEditorTool('brush'); if (!drawing) startDrawing(); });
    toolButtons.eraser = makeTool('▱', 'Eraser', () => { setEditorTool('eraser'); if (!drawing) startDrawing(); });
    toolButtons.text = makeTool('T', 'Text', () => { setEditorTool('text'); if (!drawing) startDrawing(); drawing?.textInput?.focus(); });
    toolButtons.line = makeTool('／', 'Line', () => { setEditorTool('line'); if (!drawing) startDrawing(); });
    toolButtons.ellipse = makeTool('○', 'Ellipse', () => { setEditorTool('ellipse'); if (!drawing) startDrawing(); });
    toolButtons.rect = makeTool('□', 'Rectangle', () => { setEditorTool('rect'); if (!drawing) startDrawing(); });
    makeTool('▧', 'Import image', () => file.click());
    makeTool('＋', 'Draw new layer', () => { setEditorTool('brush'); startDrawing(); });
    el('h3', { text: 'Costume canvas' }, center);
    const workspace = el('div', { class: 'svs-workspace' }, center);
    const artboard = el('div', { class: 'svs-artboard', tabindex: 0, role: 'application', 'aria-label': 'Variable costume canvas' }, workspace);
    artboard.addEventListener('pointerdown', () => { try { artboard.focus({ preventScroll: true }); } catch { artboard.focus(); } }, true);
    const hint = el('div', { class: 'svs-preview-note', text: 'Checkerboard = transparent. The dashed outline is the costume boundary; artwork outside it remains visible.' }, center);
    const propsSection = el('div', { class: 'svs-side-section' }, right);
    el('hr', { class: 'svs-sep' }, propsSection);
    el('h3', { text: 'Layer properties' }, propsSection);
    const props = el('div', {}, propsSection);
    const status = el('div', { class: 'svs-status' }, propsSection);
    let clipboardPart = null;
    copyBtn.addEventListener('click', () => { const p = activePart(); if (!p) return; clipboardPart = clone(p); pasteBtn.disabled = false; status.textContent = 'Layer copied.'; });
    pasteBtn.addEventListener('click', () => { if (!clipboardPart) return; const p = clone(clipboardPart); p.id = crypto.randomUUID(); p.name = (p.name || 'Layer') + ' copy'; p.x = num(p.x) + 12; p.y = num(p.y) + 12; addPartObject(p); });
    deleteBtn.addEventListener('click', deleteActivePart);
    flipHBtn.addEventListener('click', () => { const p = activePart(); if (!p) return; p.flipX = !p.flipX; drawPreview(); saveQuiet(); });
    flipVBtn.addEventListener('click', () => { const p = activePart(); if (!p) return; p.flipY = !p.flipY; drawPreview(); saveQuiet(); });
    raiseBtn.addEventListener('click', () => { const i = design.parts.findIndex(x => x.id === selectedId); if (i < 0 || i === design.parts.length - 1) return; [design.parts[i], design.parts[i + 1]] = [design.parts[i + 1], design.parts[i]]; redrawLayers(); drawPreview(); });
    lowerBtn.addEventListener('click', () => { const i = design.parts.findIndex(x => x.id === selectedId); if (i <= 0) return; [design.parts[i], design.parts[i - 1]] = [design.parts[i - 1], design.parts[i]]; redrawLayers(); drawPreview(); });
    let selectedId = design.parts[0]?.id || null;
    let drawing = null;
    const objectHistory = [];
    const objectRedo = [];
    let programTargetSelect = null;
    function refreshProgramTargets() {
      if (!programTargetSelect) return;
      const keep = programTargetSelect.value || design.programTarget || '';
      programTargetSelect.replaceChildren();
      for (const part of design.parts) el('option', { value: part.id, text: part.name || part.id }, programTargetSelect);
      programTargetSelect.value = design.parts.some(part => part.id === keep) ? keep : (design.parts[0]?.id || '');
      design.programTarget = programTargetSelect.value;
    }
    function syncObjectHistory() {
      undoPaintBtn.disabled = objectHistory.length === 0;
      redoPaintBtn.disabled = objectRedo.length === 0;
    }
    function recordObjectAction(action) {
      objectHistory.push(action);
      if (objectHistory.length > 200) objectHistory.shift();
      objectRedo.length = 0;
      syncObjectHistory();
    }
    function insertPart(part, index) {
      if (design.parts.some(p => p.id === part.id)) return;
      design.parts.splice(clamp(index, 0, design.parts.length), 0, part);
      selectedId = part.id;
    }
    function addPartObject(part) {
      const index = design.parts.length;
      insertPart(part, index);
      recordObjectAction({ type: 'add', part, index });
      refreshProgramTargets();
      redrawLayers(); drawPreview(); properties();
      return part;
    }
    function removePartObject(part) {
      const index = design.parts.findIndex(x => x.id === part?.id);
      if (index < 0) return false;
      design.parts.splice(index, 1);
      recordObjectAction({ type: 'remove', part, index });
      selectedId = design.parts[Math.min(index, design.parts.length - 1)]?.id || null;
      refreshProgramTargets();
      redrawLayers(); drawPreview(); properties(); syncObjectHistory();
      return true;
    }
    function applyObjectAction(action, undo) {
      if (!action) return;
      if (action.type === 'add') {
        if (undo) design.parts = design.parts.filter(p => p.id !== action.part.id);
        else insertPart(action.part, action.index);
      } else if (action.type === 'remove') {
        if (undo) insertPart(action.part, action.index);
        else design.parts = design.parts.filter(p => p.id !== action.part.id);
      }
      selectedId = action.part.id && design.parts.some(p => p.id === action.part.id) ? action.part.id : (design.parts[0]?.id || null);
      refreshProgramTargets();
      redrawLayers(); drawPreview(); properties(); syncObjectHistory();
      status.textContent = undo ? 'Undo: vector/layer restored.' : 'Redo: vector/layer action restored.';
    }
    function undoObject() {
      const action = objectHistory.pop();
      if (!action) return;
      objectRedo.push(action); applyObjectAction(action, true);
    }
    function redoObject() {
      const action = objectRedo.pop();
      if (!action) return;
      objectHistory.push(action); applyObjectAction(action, false);
    }
    function activePart() { return design.parts.find(p => p.id === selectedId); }
    function deleteActivePart() {
      const p = activePart();
      if (!p) return false;
      const removed = removePartObject(p);
      if (removed) status.textContent = 'Selected vector/layer deleted. Use Undo to restore it.';
      return removed;
    }
    let editorHasPointerFocus = false;
    const editorPointerFocus = e => { editorHasPointerFocus = box.contains(e.target); };
    document.addEventListener('pointerdown', editorPointerFocus, true);
    const editorKeydown = e => {
      if (!box.isConnected || !S.panel?.contains(box) || !S.panel.classList.contains('open') || !editorHasPointerFocus) return;
      const targetNode = e.target;
      const typing = targetNode && (targetNode.matches?.('input,textarea,select,[contenteditable="true"]') || targetNode.isContentEditable);
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
        if (deleteActivePart()) { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !typing) {
        if (e.key.toLowerCase() === 'z') {
          if (objectHistory.length) { undoObject(); e.preventDefault(); e.stopPropagation(); }
        } else if (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) {
          if (objectRedo.length) { redoObject(); e.preventDefault(); e.stopPropagation(); }
        }
      }
    };
    document.addEventListener('keydown', editorKeydown, true);
    S.editorCleanup = () => { document.removeEventListener('keydown', editorKeydown, true); document.removeEventListener('pointerdown', editorPointerFocus, true); };
    function fitScale() { const maxW = Math.max(160, workspace.clientWidth - 32), maxH = Math.max(160, workspace.clientHeight - 32); return Math.min(1, maxW / num(design.artW, 300), maxH / num(design.artH, 180)); }
    function positionPreview() {
      const s = fitScale();
      artboard.style.width = `${num(design.artW, 300) * s}px`;
      artboard.style.height = `${num(design.artH, 180) * s}px`;
      for (const node of artboard.querySelectorAll('.svs-part')) {
        const p = design.parts.find(x => x.id === node.dataset.partId); if (!p) continue;
        node.style.width = `${p.width * s}px`; node.style.height = `${p.height * s}px`;
        const o = partTransform(p, getVariable(design)?.value ?? 0, null);
        node.style.left = `calc(50% + ${o.x * s}px)`; node.style.top = `calc(50% + ${o.y * s}px)`;
        node.style.transform = `translate(-50%,-50%) rotate(${o.rotation}deg) scale(${o.scale / 100}) scaleX(${p.flipX ? -1 : 1}) scaleY(${p.flipY ? -1 : 1})`;
        node.style.opacity = String(clamp(o.opacity / 100, 0, 1));
      }
    }
    function redrawLayers() {
      layerList.replaceChildren();
      design.parts.forEach((p, i) => {
        const row = el('div', { class: 'svs-layer' + (p.id === selectedId ? ' active' : '') }, layerList);
        el('div', { text: p.name || `Layer ${i + 1}` }, row);
        el('div', { class: 'svs-small', text: `${p.type === 'vector' ? 'Vector object' : p.type === 'drawing' ? 'Drawing' : 'Image'} · ${Math.round(p.width)}×${Math.round(p.height)}${p.visible === false ? ' · hidden' : ''}` }, row);
        row.addEventListener('click', () => { selectedId = p.id; redrawLayers(); drawPreview(); properties(); });
        const move = el('div', { class: 'svs-toolbar' }, row);
        el('button', { class: 'svs-btn alt', text: '↑', title: 'Move layer up', disabled: i === 0, onclick: e => { e.stopPropagation(); [design.parts[i - 1], design.parts[i]] = [design.parts[i], design.parts[i - 1]]; redrawLayers(); drawPreview(); } }, move);
        el('button', { class: 'svs-btn alt', text: '↓', title: 'Move layer down', disabled: i === design.parts.length - 1, onclick: e => { e.stopPropagation(); [design.parts[i + 1], design.parts[i]] = [design.parts[i], design.parts[i + 1]]; redrawLayers(); drawPreview(); } }, move);
      });
    }
    function drawPreview() {
      const activeCanvas = drawing?.cvs || null;
      artboard.replaceChildren();
      const s = fitScale();
      if (design.showOnionSkin !== false) {
        const onion = makeOnionSkin(design, s);
        if (onion) artboard.append(onion);
      }
      for (const p of design.parts) {
        const img = el('img', { class: 'svs-part' + (p.id === selectedId ? ' selected' : ''), src: p.src, alt: p.name || 'Costume component', draggable: 'false' }, artboard);
        img.dataset.partId = p.id;
        img.style.width = `${p.width * s}px`; img.style.height = `${p.height * s}px`;
        img.style.opacity = String(clamp(num(p.opacity, 100) / 100, 0, 1));
        img.style.display = p.visible === false ? 'none' : '';
        img.style.transform = `translate(-50%,-50%) rotate(${num(p.rotation, 0)}deg) scale(${num(p.scale, 100) / 100}) scaleX(${p.flipX ? -1 : 1}) scaleY(${p.flipY ? -1 : 1})`;
        img.style.left = `calc(50% + ${num(p.x, 0) * s}px)`; img.style.top = `calc(50% + ${num(p.y, 0) * s}px)`;
        img.addEventListener('pointerdown', e => {
          if (e.button !== 0 || (drawing && editorTool !== 'select')) return;
          selectedId = p.id;
          for (const layerNode of artboard.querySelectorAll('.svs-part')) layerNode.classList.toggle('selected', layerNode.dataset.partId === selectedId);
          redrawLayers(); properties();
          const k = fitScale(), startX = e.clientX, startY = e.clientY, ox = p.x, oy = p.y;
          img.setPointerCapture?.(e.pointerId);
          const move = ev => { p.x = Math.round(ox + (ev.clientX - startX) / k); p.y = Math.round(oy + (ev.clientY - startY) / k); img.style.left = `calc(50% + ${p.x * k}px)`; img.style.top = `calc(50% + ${p.y * k}px)`; };
          const up = () => { img.removeEventListener('pointermove', move); img.removeEventListener('pointerup', up); saveQuiet(); properties(); };
          img.addEventListener('pointermove', move); img.addEventListener('pointerup', up, { once: true }); e.preventDefault(); e.stopPropagation();
        });
      }
      if (design.showValue !== false) {
        const pos = valueLayout(design);
        const preview = el('div', { class: 'svs-readout-preview', text: String(getVariable(design)?.value ?? '123') }, artboard);
        preview.style.left = `${pos.x * s}px`;
        preview.style.top = `${pos.y * s}px`;
        preview.style.fontSize = `${pos.size * s}px`;
        preview.style.color = design.valueColor || '#ffffff';
        preview.style.webkitTextStroke = `${Math.max(.5, pos.size * s * .09)}px ${design.valueOutline || '#111111'}`;
        preview.style.textShadow = `0 0 1px ${design.valueOutline || '#111111'}`;
        preview.style.transform = pos.anchor === 'start' ? 'translate(0,-50%)' : pos.anchor === 'end' ? 'translate(-100%,-50%)' : 'translate(-50%,-50%)';
      }
      if (activeCanvas) artboard.append(activeCanvas);
      positionPreview();
    }
    function saveQuiet() { try { localStorage.setItem(STORE, JSON.stringify(S.designs.map(x => x.id === design.id ? design : x))); } catch { /* Reported on explicit Save. */ } }
    function field(parent, label, key, value, step = '1') {
      el('label', { class: 'svs-label', text: label }, parent);
      const input = el('input', { class: 'svs-input', type: 'number', step, value }, parent);
      input.addEventListener('input', () => { const p = activePart(); if (!p) return; p[key] = num(input.value, 0); drawPreview(); });
      return input;
    }
    function properties() {
      props.replaceChildren();
      const p = activePart();
      if (!p) { el('div', { class: 'svs-hint', text: 'Select a layer to edit its position, size, rotation and variable-driven movement.' }, props); return; }
      const pname = el('input', { class: 'svs-input', value: p.name || '', placeholder: 'Layer name' }, props);
      pname.addEventListener('input', () => { p.name = pname.value; redrawLayers(); });
      field(props, 'X position', 'x', p.x); field(props, 'Y position', 'y', p.y);
      field(props, 'Width', 'width', p.width); field(props, 'Height', 'height', p.height);
      field(props, 'Rotation (degrees)', 'rotation', p.rotation); field(props, 'Scale (%)', 'scale', p.scale); field(props, 'Opacity (%)', 'opacity', p.opacity);
      const vis = el('input', { type: 'checkbox', checked: p.visible !== false }, props);
      const vl = el('label', { class: 'svs-check', text: 'Visible' }, props); vl.prepend(vis);
      vis.addEventListener('change', () => { p.visible = vis.checked; drawPreview(); redrawLayers(); });
      el('hr', { class: 'svs-sep' }, props);
      el('strong', { text: 'Variable mapping' }, props);
      const axis = el('select', { class: 'svs-select' }, props);
      for (const a of ['rotation', 'x', 'y', 'scale', 'opacity']) el('option', { value: a, text: a[0].toUpperCase() + a.slice(1) }, axis);
      const rule = p.rules?.[axis.value] || { min: 0, max: 100, from: 0, to: axis.value === 'rotation' ? 360 : 100, clamp: true };
      const rmin = field(props, 'Input minimum', 'rmin', rule.min), rmax = field(props, 'Input maximum', 'rmax', rule.max), rfrom = field(props, 'Output at minimum', 'rfrom', rule.from), rto = field(props, 'Output at maximum', 'rto', rule.to);
      const clampBox = el('input', { type: 'checkbox', checked: rule.clamp !== false }, props);
      const cl = el('label', { class: 'svs-check', text: 'Clamp output range' }, props); cl.prepend(clampBox);
      const commitRule = () => { p.rules ||= {}; p.rules[axis.value] = { min: num(rmin.value), max: num(rmax.value, 100), from: num(rfrom.value), to: num(rto.value), clamp: clampBox.checked }; };
      for (const i of [rmin, rmax, rfrom, rto]) i.addEventListener('change', commitRule);
      clampBox.addEventListener('change', commitRule);
      axis.addEventListener('change', () => properties());
      el('button', { class: 'svs-btn danger', text: 'Delete layer', onclick: deleteActivePart }, props);
    }
    function startDrawing() {
      if (drawing) return;
      const toolbar = el('div', { class: 'svs-box', style: { marginTop: '8px' } }, center);
      center.insertBefore(toolbar, workspace);
      el('strong', { text: 'Vector drawing mode' }, toolbar);
      el('div', { class: 'svs-hint', text: 'Each brush stroke, shape or text item becomes its own editable layer. Select a layer and press Delete to remove only that object. Undo/Redo also works one object at a time.' }, toolbar);
      const row = el('div', { class: 'svs-row', style: { flexWrap: 'wrap' } }, toolbar);
      const textInput = el('input', { class: 'svs-text-input', type: 'text', placeholder: 'Text to place (choose Text, then click canvas)', 'aria-label': 'Text to draw' }, row);
      const textSize = el('input', { class: 'svs-input', type: 'number', min: 6, max: 240, value: 24, title: 'Text size', style: { maxWidth: '82px' } }, row);
      const addTextButton = el('button', { class: 'svs-btn alt', text: 'Add text at centre', title: 'Insert text at the centre of the costume' }, row);
      const cvs = el('canvas', { class: 'svs-drawcanvas', tabindex: 0, 'aria-label': 'Vector drawing canvas' }, artboard);
      cvs.style.pointerEvents = editorTool === 'select' ? 'none' : 'auto';
      cvs.width = Math.max(1, Math.round(num(design.artW, 300) * 2));
      cvs.height = Math.max(1, Math.round(num(design.artH, 180) * 2));
      const ctx = cvs.getContext('2d');
      if (!ctx) { toolbar.remove(); cvs.remove(); status.textContent = 'Drawing canvas could not start. Reopen the editor and try again.'; return; }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      let down = false, startPoint = null, gesturePoints = [], gestureStart = null, activeDrawTool = 'brush';
      const syncButtons = syncObjectHistory;
      const scalePoint = q => ({ x: q.x / 2, y: q.y / 2 });
      const pt = e => {
        const r = cvs.getBoundingClientRect();
        return { x: (e.clientX - r.left) / Math.max(1, r.width) * cvs.width, y: (e.clientY - r.top) / Math.max(1, r.height) * cvs.height };
      };
      const drawLiveShape = q => {
        if (!startPoint || !gestureStart) return;
        ctx.putImageData(gestureStart, 0, 0);
        ctx.beginPath(); ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = outlineColor.value; ctx.fillStyle = fillColor.value;
        ctx.lineWidth = Math.max(1, num(brushSize.value, 4)) * 2;
        if (activeDrawTool === 'line') { ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        if (activeDrawTool === 'rect') { ctx.rect(startPoint.x, startPoint.y, q.x - startPoint.x, q.y - startPoint.y); ctx.fill(); ctx.stroke(); }
        if (activeDrawTool === 'ellipse') {
          const rx = Math.abs(q.x - startPoint.x) / 2, ry = Math.abs(q.y - startPoint.y) / 2;
          ctx.ellipse((q.x + startPoint.x) / 2, (q.y + startPoint.y) / 2, Math.max(.5, rx), Math.max(.5, ry), 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      };
      function makeVectorPart(kind, start, end, points, text) {
        const sw = Math.max(1, num(brushSize.value, 4));
        const pad = kind === 'text' ? 2 : sw / 2 + 2;
        let minX, minY, maxX, maxY, element = '';
        const esc = svgEscape;
        if (kind === 'brush') {
          const pts = points.map(scalePoint);
          if (!pts.length) return null;
          minX = Math.min(...pts.map(p => p.x)) - pad; maxX = Math.max(...pts.map(p => p.x)) + pad;
          minY = Math.min(...pts.map(p => p.y)) - pad; maxY = Math.max(...pts.map(p => p.y)) + pad;
          const d = pts.length === 1 ? `M ${pts[0].x} ${pts[0].y} l 0.01 0.01` : `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;
          element = `<path d="${d}" fill="none" stroke="${esc(fillColor.value)}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else if (kind === 'line' || kind === 'rect' || kind === 'ellipse') {
          const a = scalePoint(start), b = scalePoint(end);
          minX = Math.min(a.x, b.x) - pad; maxX = Math.max(a.x, b.x) + pad;
          minY = Math.min(a.y, b.y) - pad; maxY = Math.max(a.y, b.y) + pad;
          if (kind === 'line') element = `<path d="M ${a.x} ${a.y} L ${b.x} ${b.y}" fill="none" stroke="${esc(outlineColor.value)}" stroke-width="${sw}" stroke-linecap="round"/>`;
          if (kind === 'rect') element = `<rect x="${Math.min(a.x,b.x)}" y="${Math.min(a.y,b.y)}" width="${Math.max(0.01,Math.abs(b.x-a.x))}" height="${Math.max(0.01,Math.abs(b.y-a.y))}" fill="${esc(fillColor.value)}" stroke="${esc(outlineColor.value)}" stroke-width="${sw}"/>`;
          if (kind === 'ellipse') element = `<ellipse cx="${(a.x+b.x)/2}" cy="${(a.y+b.y)/2}" rx="${Math.max(.01,Math.abs(b.x-a.x)/2)}" ry="${Math.max(.01,Math.abs(b.y-a.y)/2)}" fill="${esc(fillColor.value)}" stroke="${esc(outlineColor.value)}" stroke-width="${sw}"/>`;
        } else if (kind === 'text') {
          const a = scalePoint(start), font = clamp(num(textSize.value, 24), 6, 240);
          ctx.save(); ctx.font = `bold ${font * 2}px Arial, sans-serif`; const width = Math.max(font * .6, ctx.measureText(text).width / 2); ctx.restore();
          minX = a.x - 1; maxX = a.x + width + 1; minY = a.y - 1; maxY = a.y + font * 1.35 + 1;
          element = `<text x="${a.x}" y="${a.y}" dominant-baseline="hanging" font-family="Arial,sans-serif" font-size="${font}" font-weight="700" fill="${esc(fillColor.value)}">${esc(text)}</text>`;
        } else return null;
        const w = Math.max(2, maxX - minX), h = Math.max(2, maxY - minY);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">${element}</svg>`;
        const src = `data:image/svg+xml;base64,${base64UTF8(svg)}`;
        return { id: crypto.randomUUID(), type: 'vector', name: `${kind[0].toUpperCase()}${kind.slice(1)} vector`, src, x: minX + w/2 - num(design.artW,180)/2, y: minY + h/2 - num(design.artH,90)/2, width: w, height: h, rotation: 0, scale: 100, opacity: 100, visible: true, rules: {}, vectorKind: kind };
      }
      addTextButton.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) { status.textContent = 'Type text in the Text to place field first.'; textInput.focus(); return; }
        const centre = { x: cvs.width / 2, y: cvs.height / 2 };
        const part = makeVectorPart('text', centre, centre, [centre], text);
        if (part) { addPartObject(part); status.textContent = 'Text added at the costume centre as an editable vector layer. Select it to move or resize.'; textInput.value = ''; textInput.focus(); }
      });
      function vectorAt(point) {
        const q = scalePoint(point), val = getVariable(design)?.value ?? 0;
        for (let i = design.parts.length - 1; i >= 0; i--) {
          const p = design.parts[i]; if (p.type !== 'vector') continue;
          const t = partTransform(p, val, null), cx = num(design.artW,180)/2 + t.x, cy = num(design.artH,90)/2 + t.y;
          const dx = q.x - cx, dy = q.y - cy, a = -t.rotation * Math.PI / 180;
          const rx = (dx * Math.cos(a) - dy * Math.sin(a)) / Math.max(.01, t.scale/100);
          const ry = (dx * Math.sin(a) + dy * Math.cos(a)) / Math.max(.01, t.scale/100);
          if (Math.abs(rx) <= p.width/2 + 3 && Math.abs(ry) <= p.height/2 + 3) return p;
        }
        return null;
      }
      function finishGesture(cancel = false) {
        if (!down) return;
        if (cancel && gestureStart) ctx.putImageData(gestureStart, 0, 0);
        if (!cancel && activeDrawTool !== 'eraser') {
          const end = gesturePoints[gesturePoints.length - 1] || startPoint;
          const part = makeVectorPart(activeDrawTool, startPoint, end, gesturePoints, '');
          if (part) {
            addPartObject(part);
            status.textContent = `Added ${part.name}. It is an independent vector layer and can be deleted or undone without affecting other artwork.`;
          }
        }
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        down = false; startPoint = null; gesturePoints = []; gestureStart = null;
        syncButtons();
      }
      cvs.addEventListener('pointerdown', e => {
        if (editorTool === 'select') return;
        activeDrawTool = editorTool;
        const point = pt(e);
        if (activeDrawTool === 'eraser') {
          const targetPart = vectorAt(point);
          if (targetPart) { removePartObject(targetPart); status.textContent = 'One vector object erased. Other vectors and imported images were left untouched.'; }
          else status.textContent = 'No vector object found at that point. Select a layer and press Delete for precise removal.';
          e.preventDefault(); e.stopPropagation();
          return;
        }
        if (activeDrawTool === 'text') {
          const text = textInput.value.trim();
          if (!text) { status.textContent = 'Enter text in the Text to place field, then click the canvas.'; textInput.focus(); return; }
          const part = makeVectorPart('text', point, point, [point], text);
          if (part) { addPartObject(part); status.textContent = 'Text added as an independent vector layer.'; textInput.value = ''; }
          e.preventDefault(); e.stopPropagation(); return;
        }
        down = true; startPoint = point; gesturePoints = [point]; gestureStart = ctx.getImageData(0, 0, cvs.width, cvs.height);
        try { cvs.setPointerCapture(e.pointerId); } catch { /* Pointer capture may be unavailable. */ }
        if (activeDrawTool === 'brush') {
          ctx.beginPath(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = fillColor.value;
          ctx.lineWidth = Math.max(1, num(brushSize.value, 4)) * 2; ctx.moveTo(point.x, point.y); ctx.lineTo(point.x + .01, point.y + .01); ctx.stroke();
        }
        e.preventDefault(); e.stopPropagation();
      });
      cvs.addEventListener('pointermove', e => {
        if (!down) return;
        const q = pt(e);
        if (activeDrawTool === 'brush') { gesturePoints.push(q); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        else { gesturePoints[gesturePoints.length - 1] = q; drawLiveShape(q); }
      });
      cvs.addEventListener('pointerup', e => {
        if (!down) return;
        const q = pt(e);
        if (activeDrawTool !== 'brush') { gesturePoints[gesturePoints.length - 1] = q; drawLiveShape(q); }
        else if (!gesturePoints.length || (q.x !== gesturePoints[gesturePoints.length-1].x || q.y !== gesturePoints[gesturePoints.length-1].y)) gesturePoints.push(q);
        finishGesture(false);
      });
      cvs.addEventListener('pointercancel', () => finishGesture(true));
      const done = () => {
        if (down) finishGesture(false);
        toolbar.remove(); cvs.remove(); drawing = null;
        undoPaintBtn.disabled = objectHistory.length === 0; redoPaintBtn.disabled = objectRedo.length === 0;
        drawPreview(); status.textContent = 'Drawing mode closed. Each drawn object remains a separate editable vector layer.';
      };
      el('button', { class: 'svs-btn', text: 'Finish drawing', onclick: done }, row);
      el('button', { class: 'svs-btn alt', text: 'Clear preview', onclick: () => { if (down) finishGesture(true); ctx.clearRect(0, 0, cvs.width, cvs.height); status.textContent = 'Temporary preview cleared; committed vector layers are unchanged.'; } }, row);
      el('button', { class: 'svs-btn alt', text: 'Cancel drawing mode', onclick: () => { if (down) finishGesture(true); toolbar.remove(); cvs.remove(); drawing = null; drawPreview(); } }, row);
      drawing = { cvs, toolbar, textInput, textSize };
      syncButtons();
    }
    file.addEventListener('change', async () => {
      try {
        const f = file.files?.[0]; if (!f) return;
        const img = await importImage(f);
        const part = { id: crypto.randomUUID(), type: 'image', name: f.name, src: img.src, x: 0, y: 0, width: img.width, height: img.height, rotation: 0, scale: 100, opacity: 100, visible: true, rules: {} };
        addPartObject(part);
        target.replaceChildren(); for (const item of design.parts) el('option', { value: item.id, text: item.name || item.id }, target); target.value = selectedId;
        status.textContent = 'Image imported. Transparency is preserved.';
      } catch (e) { alert(e.message || String(e)); } finally { file.value = ''; }
    });

    const toggles = el('div', { class: 'svs-box', style: { marginTop: '9px' } }, box);
    el('h3', { text: 'Original Scratch monitor' }, toggles);
    el('div', { class: 'svs-pill', text: 'In-place replacement · no Stage object' }, toggles);
    const showVal = el('input', { type: 'checkbox', checked: design.showValue !== false });
    const l3 = el('label', { class: 'svs-check', text: 'Show live variable value on the monitor' }, toggles); l3.prepend(showVal);
    const valueFields = el('div', {}, toggles);
    el('label', { class: 'svs-label', text: 'Variable value position' }, valueFields);
    const valuePosition = el('select', { class: 'svs-select' }, valueFields);
    for (const [v, label] of [['top-left','Top left'],['top-center','Top centre'],['top-right','Top right'],['middle-left','Middle left'],['center','Centre'],['middle-right','Middle right'],['bottom-left','Bottom left'],['bottom-center','Bottom centre'],['bottom-right','Bottom right'],['custom','Custom X / Y']]) el('option', { value: v, text: label }, valuePosition);
    valuePosition.value = design.valuePosition || 'bottom-center';
    const customPosition = el('div', { class: 'svs-row' }, valueFields);
    const valueX = el('input', { class: 'svs-input', type: 'number', value: design.valueX ?? 90, title: 'Value X position in costume pixels' }, customPosition);
    const valueY = el('input', { class: 'svs-input', type: 'number', value: design.valueY ?? 78, title: 'Value Y position in costume pixels' }, customPosition);
    const styleRow = el('div', { class: 'svs-row' }, valueFields);
    const valueSize = el('input', { class: 'svs-input', type: 'number', min: 8, max: 64, value: design.valueSize ?? 16, title: 'Value font size' }, styleRow);
    const valueColor = el('input', { class: 'svs-input', type: 'color', value: design.valueColor || '#ffffff', title: 'Value text colour', style: { maxWidth: '60px', height: '32px', padding: '2px' } }, styleRow);
    const valueOutline = el('input', { class: 'svs-input', type: 'color', value: design.valueOutline || '#111111', title: 'Value outline colour', style: { maxWidth: '60px', height: '32px', padding: '2px' } }, styleRow);
    const syncValueFields = () => {
      valueFields.style.display = showVal.checked ? '' : 'none';
      customPosition.style.display = showVal.checked && valuePosition.value === 'custom' ? '' : 'none';
      design.showValue = showVal.checked; design.valuePosition = valuePosition.value;
      design.valueX = num(valueX.value, num(design.artW, 180) / 2); design.valueY = num(valueY.value, num(design.artH, 90) / 2);
      design.valueSize = clamp(num(valueSize.value, 16), 8, 64); design.valueColor = valueColor.value; design.valueOutline = valueOutline.value;
      drawPreview();
    };
    [showVal, valuePosition, valueX, valueY, valueSize, valueColor, valueOutline].forEach(n => n.addEventListener('change', syncValueFields));
    valuePosition.addEventListener('input', syncValueFields); valueX.addEventListener('input', syncValueFields); valueY.addEventListener('input', syncValueFields); valueSize.addEventListener('input', syncValueFields);
    const onionCheck = el('input', { type: 'checkbox', checked: design.showOnionSkin !== false });
    const onionLabel = el('label', { class: 'svs-check', text: 'Show original Scratch monitor as onion skin in the costume editor' }, toggles); onionLabel.prepend(onionCheck);
    const onionOpacity = el('input', { class: 'svs-input', type: 'range', min: 30, max: 80, value: clamp(num(design.onionOpacity, 35), 30, 80), title: 'Onion-skin opacity' }, toggles);
    const onionStatus = el('div', { class: 'svs-hint', text: 'Looking for the original Scratch monitor…' }, toggles);
    const refreshReference = el('button', { class: 'svs-btn alt', text: 'Refresh original monitor reference' }, toggles);
    const syncOnion = () => {
      design.showOnionSkin = onionCheck.checked;
      design.onionOpacity = clamp(num(onionOpacity.value, 35), 30, 80);
      onionOpacity.disabled = !onionCheck.checked;
      const source = findOriginalMonitorNode(design);
      onionStatus.textContent = source
        ? `Original Scratch monitor found. Reference is shown at ${design.onionOpacity}% opacity in the editor only.`
        : 'Original monitor not detected yet. Keep the variable monitor visible in Scratch, select the matching variable above, then use Refresh original monitor reference.';
      drawPreview();
    };
    refreshReference.addEventListener('click', () => { scan(); styleMonitors(); refreshMonitorChoices(); syncOnion(); });
    onionCheck.addEventListener('change', syncOnion); onionOpacity.addEventListener('input', syncOnion);
    syncValueFields(); syncOnion();
    el('div', { class: 'svs-hint', text: 'Make the normal Scratch variable monitor visible in the Data panel first. SVS replaces that exact monitor in place; the onion skin is only a ghosted reference in this editor.' }, toggles);

    const program = el('div', { class: 'svs-box svs-code-panel' }, box);
    const enabled = el('input', { type: 'checkbox', checked: !!design.programmable }); const pl = el('label', { class: 'svs-check', text: 'Enable programmable costume (custom code)' }, program); pl.prepend(enabled);
    const programFields = el('div', {}, program);
    const language = el('select', { class: 'svs-select' }, programFields); el('option', { value: 'javascript', text: 'JavaScript — multi-layer control' }, language); el('option', { value: 'cstyle', text: 'C-style script — single numeric output' }, language); language.value = design.language || 'javascript';
    const target = el('select', { class: 'svs-select' }, programFields);
    programTargetSelect = target;
    refreshProgramTargets();
    target.value = design.programTarget || design.parts[0]?.id || '';
    const property = el('select', { class: 'svs-select' }, programFields); for (const p of ['rotation', 'x', 'y', 'scale', 'opacity']) el('option', { value: p, text: `Return value controls ${p}` }, property); property.value = design.programProperty || 'rotation';
    const ranges = el('div', { class: 'svs-row' }, programFields);
    const pmin = el('input', { class: 'svs-input', type: 'number', value: design.programMin ?? 0, title: 'Program input minimum' }, ranges); const pmax = el('input', { class: 'svs-input', type: 'number', value: design.programMax ?? 100, title: 'Program input maximum' }, ranges);
    const code = el('textarea', { class: 'svs-code', spellcheck: 'false' }, programFields); code.value = design.programCode || '';
    const codeHelp = el('div', { class: 'svs-hint', text: 'JavaScript receives value, previousValue, delta, elapsed, min, max, clamp(), abs(), sqrt(), sin(), cos(), tan() and PI. Return { parts: [{rotation: 0}, {x: 20}], text: value }. The parts array follows the Layers list.' }, programFields);
    const cHelp = el('div', { class: 'svs-hint', text: 'C-style mode accepts a practical C-like subset: typed numeric declarations (int/float/double), if/else, loops and return. It returns one number for the selected layer/property; it is not a full native C compiler.' }, programFields);
    const codeActions = el('div', { class: 'svs-toolbar' }, programFields);
    const test = el('button', { class: 'svs-btn alt', text: 'Test with current value' }, codeActions);
    const sample = el('button', { class: 'svs-btn alt', text: 'Insert example' }, codeActions);
    const langUpdate = () => { design.language = language.value; codeHelp.style.display = language.value === 'javascript' ? '' : 'none'; cHelp.style.display = language.value === 'cstyle' ? '' : 'none'; target.style.display = language.value === 'cstyle' ? '' : 'none'; property.style.display = language.value === 'cstyle' ? '' : 'none'; };
    language.addEventListener('change', langUpdate); langUpdate();
    enabled.addEventListener('change', () => { programFields.style.display = enabled.checked ? '' : 'none'; }); programFields.style.display = enabled.checked ? '' : 'none';
    sample.addEventListener('click', () => {
      code.value = language.value === 'javascript'
        ? `const ratio = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);\nreturn {\n  parts: [\n    { rotation: -135 + ratio * 270 },\n    { opacity: 30 + ratio * 70 }\n  ],\n  text: Math.round(value)\n};`
        : `double ratio = max == min ? 0 : (value - min) / (max - min);\nif (ratio < 0) ratio = 0;\nif (ratio > 1) ratio = 1;\nreturn -135 + ratio * 270;`;
    });
    test.addEventListener('click', () => {
      try {
        Object.assign(design, { language: language.value, programCode: code.value, programTarget: target.value, programProperty: property.value });
        const v = getVariable(design); const result = runProgram({ ...design, programmable: true }, v?.value ?? 0, 0, 0);
        if (language.value === 'cstyle' && result) status.textContent = `Test passed: ${result.parts?.[0]?.[property.value] ?? 'numeric output'}`;
        else if (result) status.textContent = `Test passed: ${JSON.stringify(result).slice(0, 220)}`;
        else status.textContent = `Code error: ${design._programError || 'check the code'}`;
      } catch (e) { status.textContent = `Code error: ${e.message}`; }
    });

    const actions = el('div', { class: 'svs-toolbar', style: { marginTop: '9px' } }, box);
    el('button', { class: 'svs-btn', text: 'Save variable costume', onclick: () => {
      const v = S.vars.find(x => x.key === variable.value); if (!v) return alert('Select a Scratch variable first.');
      if (!design.parts.length) return alert('Import an image or draw at least one layer.');
      if (drawing) return alert('Finish or cancel the drawing layer first.');
      Object.assign(design, { name: name.value.trim() || v.name, variableId: v.id, variableKey: v.key, variableName: v.name, targetId: v.targetId, target: v.target, stage: false, monitor: true, showValue: showVal.checked, valuePosition: valuePosition.value, valueX: num(valueX.value, 90), valueY: num(valueY.value, 45), valueSize: clamp(num(valueSize.value, 16), 8, 64), valueColor: valueColor.value, valueOutline: valueOutline.value, showOnionSkin: onionCheck.checked, onionOpacity: clamp(num(onionOpacity.value, 35), 30, 80), monitorBlockId: monitorBind.value || null, artW: clamp(num(aw.value, 180), 40, 1400), artH: clamp(num(ah.value, 90), 40, 1400), programmable: enabled.checked, language: language.value, programCode: code.value, programTarget: target.value, programProperty: property.value, programMin: num(pmin.value, 0), programMax: num(pmax.value, 100) });
      try { if (design.programmable) compileProgram(design); } catch (e) { return alert(`Fix the program before saving: ${e.message}`); }
      const idx = S.designs.findIndex(x => x.id === design.id); if (idx >= 0) S.designs[idx] = design; else S.designs.push(design);
      S.active = design.id; if (!save()) return; compiled.delete(design.id); S.editorCleanup?.(); S.editorCleanup = null; box.remove(); renderList(); styleMonitors(); renderMonitors(performance.now());
    } }, actions);
    el('button', { class: 'svs-btn alt', text: 'Export PNG', onclick: exportPNG }, actions);
    el('button', { class: 'svs-btn alt', text: 'Cancel', onclick: () => { S.editorCleanup?.(); S.editorCleanup = null; box.remove(); } }, actions);

    function exportPNG() {
      const w = clamp(num(design.artW, 300), 40, 1400), h = clamp(num(design.artH, 180), 40, 1400);
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d');
      const jobs = design.parts.map(p => new Promise(resolve => { const im = new Image(); im.onload = () => { const x = w / 2 + p.x - p.width / 2, y = h / 2 + p.y - p.height / 2; ctx.save(); ctx.globalAlpha = clamp(p.opacity / 100, 0, 1); ctx.translate(w / 2 + p.x, h / 2 + p.y); ctx.rotate(p.rotation * Math.PI / 180); ctx.scale((p.scale / 100) * (p.flipX ? -1 : 1), (p.scale / 100) * (p.flipY ? -1 : 1)); if (p.visible !== false) ctx.drawImage(im, -p.width / 2, -p.height / 2, p.width, p.height); ctx.restore(); resolve(); }; im.onerror = resolve; im.src = p.src; }));
      Promise.all(jobs).then(() => { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `${(name.value || 'svs-costume').replace(/[^a-z0-9-_]/gi, '_')}.png`; a.click(); });
    }

    [aw, ah].forEach(i => i.addEventListener('change', () => { design.artW = clamp(num(aw.value, 300), 40, 1400); design.artH = clamp(num(ah.value, 180), 40, 1400); aw.value = design.artW; ah.value = design.artH; drawPreview(); }));
    redrawLayers(); drawPreview(); properties();
  }

  function init() {
    const root = el('div', { id: 'svs-root' }, document.body);
    const toggle = el('button', { id: 'svs-toggle', text: 'SVS · Variable Studio' }, root);
    const panel = el('div', { id: 'svs-panel' }, root); S.panel = panel;
    toggle.addEventListener('click', () => panel.classList.toggle('open'));
    const head = el('div', { class: 'svs-head' }, panel);
    const titleWrap = el('div', {}, head); el('div', { class: 'svs-title', text: 'Scratch Variable Studio' }, titleWrap); el('div', { class: 'svs-sub', text: 'v0.7 · Monitor-reference + editor interaction fixes' }, titleWrap);
    el('span', { class: 'svs-pill', text: 'Transparent · Layered · Programmable' }, head);
    el('button', { class: 'svs-btn', text: '+ Create variable costume', onclick: () => editor(null) }, panel);
    el('div', { class: 'svs-monitor-health', id: 'svs-monitor-health', text: 'Finding existing Scratch variable monitors…' }, panel);
    el('div', { class: 'svs-box svs-designs', style: { marginTop: '9px' } }, panel);
    el('div', { class: 'svs-hint', text: 'Build displays for any Scratch variable by transforming its existing Scratch monitor in place. Import transparent artwork, draw layers, position components beyond the costume bounds, and program their motion with JavaScript or C-style scripts. SVS does not create Stage sprites or extra Stage objects.' }, panel);
    renderList();
  }

  function updateMonitorHealth() {
    const box = S.panel?.querySelector('#svs-monitor-health'); if (!box) return;
    const found = monitorNodes();
    const linked = found.filter(host => S.designs.some(d => monitorMatches(host, d)));
    const labels = found.slice(0, 4).map(host => { const info = getReactMonitorInfo(host); return (monitorLabel(host, info) || 'Unnamed monitor') + (info.id ? ' [' + String(info.id).slice(0, 7) + ']' : ' [ID unavailable]'); });
    if (!found.length) box.textContent = 'No Scratch monitor elements detected. Tick the variable checkbox in Scratch’s Data panel first.';
    else if (!linked.length && S.designs.length) box.textContent = found.length + ' existing Scratch monitor(s) detected (' + labels.join(', ') + '), but no costume is linked. Open the costume and choose the exact monitor from its selector.';
    else box.textContent = found.length + ' original Scratch monitor(s) detected · ' + linked.length + ' linked. SVS applies artwork to the existing draggable monitor.';
  }

  load(); init();
  function loop(now) {
    if (now - S.lastScan > 1000) { S.lastScan = now; scan(); updateMonitorHealth(); }
    if (now - S.lastStyle > 250) { S.lastStyle = now; styleMonitors(); }
    renderMonitors(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

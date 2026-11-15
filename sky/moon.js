import { MOON_VARIANTS, MOON_MODES, MOON_WEIGHTS } from "./moon-data.js?v=13";

import { openStudy } from "./study.js?v=1";

const $ = (id) => document.getElementById(id);
const VKEY = "nightweave-moon-variant";
let variant = MOON_VARIANTS[0];
let MOON_IMAGE = variant.image, MOON_ITEMS = [], MAX = 0;
const MKEY = "nightweave-moon-mode";
let mode = "sea";
const keyOf = (v) => `nightweave-moon-v3-${v.id}-${mode}`;
const r2 = (n) => Math.round(n * 100) / 100;
const weightOf = (item) => MOON_WEIGHTS[item.kind];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const NS = "http://www.w3.org/2000/svg";

function insidePolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Попадание: море — внутрь области (не обязательно в центр), кратер — в круг вокруг центра.
// Геометрия: маркеры хранятся в пикселях самого фото, поэтому поворот не влияет на проверку.
// Сцена — квадрат со стороной чуть больше длинной стороны фото; фото повёрнуто вокруг своего центра.
const side = () => Math.max(MOON_IMAGE.width, MOON_IMAGE.height) * 1.12;
function toStage([x, y]) {
  const a = (state.angle * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  const dx = x - MOON_IMAGE.width / 2, dy = y - MOON_IMAGE.height / 2, S = side();
  return [(dx * c - dy * sn) / S + 0.5, (dx * sn + dy * c) / S + 0.5];
}
function toImage(fx, fy) {
  const a = (state.angle * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), S = side();
  const px = (fx - 0.5) * S, py = (fy - 0.5) * S;
  return [px * c + py * sn + MOON_IMAGE.width / 2, -px * sn + py * c + MOON_IMAGE.height / 2];
}
function hit(item, p) {
  return item.kind === "sea"
    ? insidePolygon(p, item.poly)
    : Math.hypot(p[0] - item.center[0], p[1] - item.center[1]) <= item.r;
}

const state = { placed: {}, checked: false, angle: 0 };
const ui = {};

function save() {
  try { localStorage.setItem(keyOf(variant), JSON.stringify(state)); } catch { /* необязательно */ }
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(keyOf(variant)));
    if (s && typeof s.placed === "object") {
      for (const [id, v] of Object.entries(s.placed))
        if (MOON_ITEMS.some((i) => i.id === id) && Array.isArray(v)) state.placed[id] = v;
      state.checked = Boolean(s.checked);
      state.angle = Number(s.angle) || 0;
    }
  } catch { /* пусто */ }
}

function build() {
  const root = el("section", "lab exam-q moon-q");

  const top = el("div", "lab-top"), tab = el("div", "tabs");
  for (const v of MOON_VARIANTS) {
    const b = el("button", "", v.title);
    b.type = "button";
    b.setAttribute("aria-selected", String(v === variant));
    b.onclick = () => v !== variant && select(v.id, mode);
    tab.append(b);
  }
  ui.state = el("span", "difficulty", "Нет ответа");
  ui.pts = el("span", "difficulty", "Балл: —");
  const status = el("div", "q-state");
  status.append(ui.state, ui.pts);
  top.append(tab, status);

  // Фото + слои
  ui.stage = el("div", "stage moon-stage");
  Object.assign(ui.stage.style, { aspectRatio: "1", overflow: "hidden", background: "#000000", position: "relative" });
  const img = el("img");
  img.src = MOON_IMAGE.src;
  img.alt = "Фотография Луны";
  img.draggable = false;
  ui.img = img;
  ui.refLayer = document.createElementNS(NS, "svg");
  ui.refLayer.setAttribute("viewBox", `0 0 ${MOON_IMAGE.width} ${MOON_IMAGE.height}`);
  ui.refLayer.setAttribute("class", "moon-ref");
  ui.refSvg = ui.refLayer;
  ui.refLayer.hidden = true;
  ui.leadLayer = document.createElementNS(NS, "svg");
  ui.leadLayer.setAttribute("viewBox", "0 0 100 100");
  ui.leadLayer.setAttribute("preserveAspectRatio", "none");
  ui.leadLayer.setAttribute("class", "moon-lead");
  ui.layer = el("div", "layer");
  ui.stage.append(img, ui.refLayer, ui.leadLayer, ui.layer);

  ui.tray = el("div", "moon-tray");
  const meta = el("div", "map-meta");
  meta.append(el("span", "", "ФОТО ЛУНЫ"), el("span", "", variant.title.toUpperCase()));
  const mapCol = el("div", "map-column");
  const ctl = el("div", "moon-rot");
  ui.slider = el("input");
  ui.slider.type = "range"; ui.slider.min = "0"; ui.slider.max = "360"; ui.slider.step = "1";
  ui.slider.setAttribute("aria-label", "Угол поворота фото");
  ui.slider.oninput = () => setAngle(Number(ui.slider.value));
  ui.out = el("output");
  const b180 = el("button", "secondary", "⟲ 180°"), bPng = el("button", "secondary", "PNG ↓");
  b180.type = bPng.type = "button";
  b180.onclick = () => setAngle((state.angle + 180) % 360);
  bPng.onclick = downloadPng;
  const lab = el("label", "", "Поворот");
  lab.append(ui.slider, ui.out);
  ctl.append(lab, b180, bPng);
  mapCol.append(meta, ui.stage, ctl, ui.tray);

  const header = el("div", "assignment-header");
  header.append(
    el("span", "eyebrow", "ЛУННЫЙ РЕЛЬЕФ"),
    el("h2", "", "Найди моря\nи кратеры"),
    el("p", "prompt", "Перетащите маркеры с названиями деталей лунного рельефа в соответствующие области на картинке. Для моря достаточно попасть в его область (не обязательно в центр), для кратера — в круг вокруг него. Чтобы убрать маркер — перетащите его за пределы фото или дважды щёлкните по нему."),
    el("p", "prompt", `Баллы: море — ${MOON_WEIGHTS.sea}, кратер — ${MOON_WEIGHTS.crater} (всего ${MAX}). Попал в область — полный балл, не попал или не отметил — 0.`),
  );
  header.children[1].style.whiteSpace = "pre-line";
  ui.list = el("ul", "ex-list moon-list");
  const aside = el("aside", "assignment");
  aside.append(header, ui.list);

  ui.feedback = el("div", "feedback");
  ui.feedback.hidden = true;
  const body = el("div", "lab-body");
  body.append(mapCol, aside);
  root.append(top, body, ui.feedback);
  $("moon").replaceChildren(root);

  for (const item of MOON_ITEMS) {
    const li = el("li", "ex-row");
    li.append(el("span", "name", item.name), (item.badge = el("span", "moon-badge")));
    item.row = li;
    ui.list.append(li);
    const chip = el("div", "moon-chip");
    chip.append(el("i"), el("span", "", item.name));
    chip.onpointerdown = (e) => startDrag(e, item, null);
    item.chip = chip;
  }
  // перемешиваем порядок в лотке, чтобы он не подсказывал положение
  const order = [...MOON_ITEMS].sort(() => Math.random() - 0.5);
  ui.tray.append(...order.map((i) => i.chip));
  ui.stage.ondragstart = (e) => e.preventDefault();
  refresh();
}

function markerNode(item) {
  const node = el("div", "mk");
  node.append(el("i"), el("span", "", item.name));
  const sp = toStage(state.placed[item.id]);
  node.style.left = sp[0] * 100 + "%";
  node.style.top = sp[1] * 100 + "%";
  if (state.checked) {
    node.classList.add(item.ok ? "good" : "bad");
    node.style.cursor = "default";
  } else {
    node.onpointerdown = (e) => startDrag(e, item, node);
    node.ondblclick = () => { delete state.placed[item.id]; save(); refresh(); };
  }
  return node;
}

function startDrag(e, item, from) {
  if (state.checked || e.button > 0) return;
  e.preventDefault();
  const ghost = el("div", "mk moon-float");
  ghost.append(el("i"), el("span", "", item.name));
  document.body.append(ghost);
  if (from) from.style.visibility = "hidden";
  const move = (ev) => {
    ghost.style.left = ev.clientX + "px";
    ghost.style.top = ev.clientY + "px";
  };
  const up = (ev) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    ghost.remove();
    const r = ui.stage.getBoundingClientRect();
    const fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
    if (ev.type !== "pointercancel" && fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) state.placed[item.id] = toImage(fx, fy);
    else if (from) delete state.placed[item.id];
    save();
    refresh();
  };
  move(e);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

function evaluate() {
  for (const item of MOON_ITEMS) {
    const p = state.placed[item.id];
    item.ok = Boolean(p) && hit(item, p);
    item.points = item.ok ? weightOf(item) : 0;
  }
}

// Подписи правильных ответов — по периферии снимка, чтобы не закрывать друг друга и детали Луны.
// Каждая подпись садится на рамку сцены в направлении своего объекта (из центра сцены),
// при конфликте сдвигается вдоль рамки, а затем уходит на второй/третий ряд внутрь.
// S — сторона сцены в пикселях, fs — размер шрифта, textW(name) — ширина текста.
function layoutRefLabels(S, fs, textW) {
  const h = Math.round(fs * 1.9), gap = 4, pad = 3, placed = [], out = [];
  const items = MOON_ITEMS.map((item) => {
    const [fx, fy] = toStage(item.center);
    return { item, tx: fx * S, ty: fy * S, w: Math.ceil(textW(item.name) + fs * 1.5), ang: Math.atan2(fy - 0.5, fx - 0.5) };
  }).sort((a, b) => a.ang - b.ang);
  // точка на периметре прямоугольника [x0,y0,x1,y1] по параметру u (по часовой стрелке от левого верхнего угла)
  const onRect = (u, [x0, y0, x1, y1]) => {
    const W = x1 - x0, H = y1 - y0, P = 2 * (W + H);
    u = ((u % P) + P) % P;
    if (u < W) return [x0 + u, y0];
    if (u < W + H) return [x1, y0 + (u - W)];
    if (u < 2 * W + H) return [x1 - (u - W - H), y1];
    return [x0, y1 - (u - 2 * W - H)];
  };
  // параметр u для луча из центра в направлении (dx,dy)
  const rayU = (dx, dy, [x0, y0, x1, y1]) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, W = x1 - x0, H = y1 - y0;
    const k = Math.min(dx ? (W / 2) / Math.abs(dx) : Infinity, dy ? (H / 2) / Math.abs(dy) : Infinity);
    const x = cx + dx * k, y = cy + dy * k;
    if (Math.abs(y - y0) < 1e-6) return x - x0;
    if (Math.abs(x - x1) < 1e-6) return W + (y - y0);
    if (Math.abs(y - y1) < 1e-6) return W + H + (x1 - x);
    return 2 * W + H + (y1 - y);
  };
  const hit = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < h + gap;
  for (const it of items) {
    // перебираем кандидатов: ближе к своему направлению — лучше; боковые края (подпись уходит вглубь фото) и вторые ряды — хуже
    let best = null, bestCost = Infinity;
    for (let row = 0; row < 4; row++) {
      const inset = row * (h + gap);
      const rect = [it.w / 2 + pad + inset, h / 2 + pad + inset, S - it.w / 2 - pad - inset, S - h / 2 - pad - inset];
      if (rect[2] <= rect[0] || rect[3] <= rect[1]) break;
      const u0 = rayU(Math.cos(it.ang), Math.sin(it.ang), rect);
      for (let d = 0; d < S * 2; d += 6)
        for (const sg of d ? [1, -1] : [1]) {
          const [x, y] = onRect(u0 + sg * d, rect), box = { x, y, w: it.w };
          const side = y > rect[1] + 1 && y < rect[3] - 1;
          const cost = d + (side ? it.w * 1.2 : 0) + row * 70;
          if (cost < bestCost && !placed.some((o) => hit(box, o))) { best = box; bestCost = cost; }
        }
    }
    if (!best) best = { x: Math.min(Math.max(it.tx, it.w / 2), S - it.w / 2), y: h / 2 + pad, w: it.w };
    placed.push(best);
    out.push({ item: it.item, tx: it.tx, ty: it.ty, lx: best.x, ly: best.y, w: it.w, h });
  }
  return out;
}
let measureCtx = null;
function measureText(font) {
  measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
  measureCtx.font = font;
  return (t) => measureCtx.measureText(t).width;
}

function drawReference() {
  ui.refLayer.replaceChildren();
  ui.refLayer.hidden = !state.checked;
  if (!state.checked) return;
  for (const item of MOON_ITEMS) {
    let shape;
    if (item.kind === "sea") {
      shape = document.createElementNS(NS, "polygon");
      shape.setAttribute("points", item.poly.map((p) => p.join(",")).join(" "));
    } else {
      shape = document.createElementNS(NS, "circle");
      shape.setAttribute("cx", item.center[0]);
      shape.setAttribute("cy", item.center[1]);
      shape.setAttribute("r", item.r);
    }
    ui.refLayer.append(shape);
  }
}

function refresh() {
  const pct = (MOON_IMAGE.width / side()) * 100;
  const box = `position:absolute;left:50%;top:50%;right:auto;bottom:auto;width:${pct}%;height:auto;max-width:none;transform:translate(-50%,-50%) rotate(${state.angle}deg);`;
  ui.img.style.cssText = box;
  ui.refSvg.style.cssText = box + `aspect-ratio:${MOON_IMAGE.width}/${MOON_IMAGE.height};`;
  ui.slider.value = state.angle;
  ui.out.textContent = Math.round(state.angle) + "°";
  if (state.checked) evaluate();
  // лоток: только не поставленные маркеры
  for (const item of MOON_ITEMS) item.chip.hidden = Boolean(state.placed[item.id]);
  ui.tray.classList.toggle("empty", MOON_ITEMS.every((i) => state.placed[i.id]));
  // слой маркеров
  ui.layer.replaceChildren();
  for (const item of MOON_ITEMS) if (state.placed[item.id]) ui.layer.append(markerNode(item));
  // эталон после проверки: зелёные области, перекрестия по центрам, подписи — по периферии, соединены тусклым пунктиром
  drawReference();
  ui.leadLayer.replaceChildren();
  if (state.checked) {
    const S = ui.stage.clientWidth || 500;
    const lay = layoutRefLabels(S, 9, measureText("9px system-ui, sans-serif"));
    for (const L of lay) {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", (L.lx / S) * 100);
      line.setAttribute("y1", (L.ly / S) * 100);
      line.setAttribute("x2", (L.tx / S) * 100);
      line.setAttribute("y2", (L.ty / S) * 100);
      ui.leadLayer.append(line);
    }
    for (const L of lay) {
      const ref = el("div", "ref");
      ref.append(el("i"));
      ref.style.left = (L.tx / S) * 100 + "%";
      ref.style.top = (L.ty / S) * 100 + "%";
      ui.layer.append(ref);
    }
    for (const L of lay) {
      const tag = el("div", "ref-edge", L.item.name);
      tag.style.left = (L.lx / S) * 100 + "%";
      tag.style.top = (L.ly / S) * 100 + "%";
      ui.layer.append(tag);
    }
  }
  // список
  for (const item of MOON_ITEMS) {
    const placed = Boolean(state.placed[item.id]);
    item.badge.textContent = state.checked ? `${item.points} из ${weightOf(item)}` : placed ? "на карте" : "";
    item.badge.className = "moon-badge" + (state.checked ? (item.ok ? " ok" : " bad") : placed ? " on" : "");
  }
  const count = Object.keys(state.placed).length;
  ui.state.textContent = state.checked ? "Проверено" : count ? `Отмечено: ${count} из ${MOON_ITEMS.length}` : "Нет ответа";
  const total = r2(MOON_ITEMS.reduce((s, i) => s + (i.points || 0), 0));
  ui.pts.textContent = state.checked ? `Балл: ${total} из ${MAX}` : "Балл: —";
  if (!state.checked) {
    ui.feedback.hidden = true;
    $("summary").hidden = true;
  }
}

function check() {
  if (state.checked) return;
  state.checked = true;
  save();
  refresh();
  const total = r2(MOON_ITEMS.reduce((s, i) => s + i.points, 0));
  ui.feedback.hidden = false;
  ui.feedback.className = "feedback" + (total / MAX > 0.85 ? " ok" : "");
  const ul = el("ul");
  for (const item of MOON_ITEMS) {
    const placed = state.placed[item.id];
    ul.append(el("li", "", `${item.ok ? "✓" : "✗"} ${item.name}: ${item.points} из ${weightOf(item)} — ${item.ok ? "попадание" : placed ? "мимо области" : "не отмечено"}`));
  }
  ui.feedback.replaceChildren(el("div", "", total / MAX > 0.85 ? "Ваш ответ верный." : total / MAX > 0.3 ? "Ваш ответ частично правильный." : "Ваш ответ неправильный."), ul);
  const s = $("summary");
  s.hidden = false;
  s.textContent = `Итого: ${total} из ${MAX} баллов`;
}

function reset() {
  state.placed = {};
  state.checked = false;
  save();
  refresh();
}

function available(v) {
  const kinds = new Set(v.items().map((i) => i.kind));
  return { sea: kinds.has("sea"), crater: kinds.has("crater"), all: kinds.size > 0 };
}

function select(id, m) {
  variant = MOON_VARIANTS.find((v) => v.id === id) || MOON_VARIANTS[0];
  if (!available(variant)[m]) m = "all";
  mode = m;
  try { localStorage.setItem(VKEY, variant.id); localStorage.setItem(MKEY, mode); } catch { /* необязательно */ }
  MOON_IMAGE = variant.image;
  MOON_ITEMS = variant.items().filter((i) => mode === "all" || i.kind === mode);
  MAX = r2(MOON_ITEMS.reduce((s, i) => s + weightOf(i), 0));
  state.placed = {};
  state.checked = false;
  state.angle = 0;
  $("summary").hidden = true;
  $("mode").textContent = "Режим: " + MOON_MODES.find((x) => x.id === mode).title;
  load();
  build();
  if (state.checked) {
    state.checked = false;
    check();
  }
}

function setAngle(a) {
  state.angle = ((a % 360) + 360) % 360;
  save();
  refresh();
}

// Скачивание текущего вида (фото с поворотом, маркеры и, после проверки, эталон) в PNG.
function downloadPng() {
  const S = Math.round(side()), W = MOON_IMAGE.width, H = MOON_IMAGE.height;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d");
  g.fillStyle = "#000000";
  g.fillRect(0, 0, S, S);
  const photo = ui.img;
  g.save();
  g.translate(S / 2, S / 2);
  g.rotate((state.angle * Math.PI) / 180);
  g.drawImage(photo, -W / 2, -H / 2, W, H);
  if (state.checked) {
    g.translate(-W / 2, -H / 2);
    g.fillStyle = "rgba(70,200,100,.2)"; g.strokeStyle = "#4be07a"; g.lineWidth = 2; g.setLineDash([6, 4]);
    for (const it of MOON_ITEMS) {
      g.beginPath();
      if (it.kind === "sea") it.poly.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))), g.closePath();
      else g.arc(it.center[0], it.center[1], it.r, 0, 7);
      g.fill(); g.stroke();
    }
  }
  g.restore();
  if (state.checked) {
    const rfs = Math.max(12, Math.round(S / 42));
    g.font = `${rfs}px system-ui, sans-serif`;
    const lay = layoutRefLabels(S, rfs, (t) => g.measureText(t).width);
    g.save();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = Math.max(1, rfs / 10); g.setLineDash([rfs / 3, rfs / 2.4]);
    for (const L of lay) { g.beginPath(); g.moveTo(L.lx, L.ly); g.lineTo(L.tx, L.ty); g.stroke(); }
    g.setLineDash([]);
    g.textBaseline = "middle"; g.textAlign = "center";
    for (const L of lay) {
      g.strokeStyle = "#4be07a"; g.fillStyle = "#4be07a";
      g.beginPath(); g.arc(L.tx, L.ty, rfs / 3, 0, 7); g.fill();
      g.fillStyle = "rgba(249,247,245,.95)"; g.lineWidth = 2;
      g.beginPath(); g.roundRect(L.lx - L.w / 2, L.ly - L.h / 2, L.w, L.h, rfs / 2.2); g.fill(); g.stroke();
      g.fillStyle = "#2e7d32"; g.fillText(L.item.name, L.lx, L.ly + 1);
    }
    g.restore();
  }
  const fs = Math.max(12, Math.round(S / 42));
  g.font = `600 ${fs}px system-ui, sans-serif`;
  g.textBaseline = "middle";
  for (const it of MOON_ITEMS) {
    const p = state.placed[it.id];
    if (!p) continue;
    const [fx, fy] = toStage(p), x = fx * S, y = fy * S, w = g.measureText(it.name).width + fs;
    g.fillStyle = state.checked ? (it.ok ? "#2e7d32" : "#dd2222") : "#000000";
    g.beginPath(); g.arc(x, y, fs / 4, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.92)";
    g.fillRect(x + fs / 2, y - fs * 0.8, w, fs * 1.6);
    g.fillStyle = "#111111";
    g.fillText(it.name, x + fs, y);
  }
  try {
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `luna-${variant.id}-${mode}-${Math.round(state.angle)}.png`;
    a.click();
  } catch {
    alert("Не удалось сохранить PNG: откройте страницу через http(s), а не как локальный файл.");
  }
}

function openModeDialog() {
  const dlg = $("mode-dialog");
  const av = available(variant);
  const box = el("div", "mode-box");
  box.append(el("h2", "", "Режим"), el("p", "fine", "Что искать на фото «" + variant.title + "»?"));
  for (const m of MOON_MODES) {
    const n = variant.items().filter((i) => m.id === "all" || i.kind === m.id).length;
    const b = el("button", "mode-opt" + (m.id === mode ? " on" : ""));
    b.type = "button";
    b.disabled = !av[m.id];
    b.append(el("strong", "", `${m.title} · ${n}`), el("span", "", av[m.id] ? m.note : "На этом фото нет подходящих объектов"));
    b.onclick = () => { dlg.close(); if (m.id !== mode) select(variant.id, m.id); };
    box.append(b);
  }
  const close = el("button", "secondary", "Отмена");
  close.type = "button";
  close.onclick = () => dlg.close();
  box.append(close);
  dlg.replaceChildren(box);
  dlg.showModal();
}

let rz = 0;
window.addEventListener("resize", () => { if (!state.checked) return; clearTimeout(rz); rz = setTimeout(refresh, 120); });
$("check").onclick = check;
$("reset").onclick = reset;
$("mode").onclick = openModeDialog;
$("mode-dialog").addEventListener("click", (e) => { if (e.target.id === "mode-dialog") e.target.close(); });
let first = MOON_VARIANTS[0].id, m0 = "sea";
try { first = localStorage.getItem(VKEY) || first; m0 = localStorage.getItem(MKEY) || m0; } catch { /* необязательно */ }
select(first, m0);

$("study").onclick = () =>
  openStudy({
    host: document.querySelector("main"),
    hide: [document.querySelector(".exam-bar"), $("moon"), $("summary")],
    sets: MOON_VARIANTS.map((v) => ({ id: v.id, title: v.title, image: v.image, items: v.items })),
    filters: [{ id: "all", title: "Всё", test: () => true }, { id: "sea", title: "Моря", test: (i) => i.kind === "sea" }, { id: "crater", title: "Кратеры", test: (i) => i.kind === "crater" }],
  });

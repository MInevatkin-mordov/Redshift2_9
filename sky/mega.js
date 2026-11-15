// Режим «Mega Science»: перетащи маркеры обсерваторий на карту мира.
// Состояние намеренно НЕ сохраняется: каждый заход на страницу начинается с чистого листа.
import { openStudy } from "./study.js?v=1";
import { openObsCards } from "./obs-cards.js?v=3";
import { MEGA_IMAGE as IMG, MEGA_ITEMS, MEGA_MODES, MEGA_WEIGHT as WEIGHT } from "./mega-data.js?v=2";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

let mode = "all", items = [], MAX = 0;
const state = { placed: {}, checked: false };
const ui = {};

const hit = (item, p) => Math.hypot(p[0] - item.center[0], p[1] - item.center[1]) <= item.r;
const toImage = (fx, fy) => [fx * IMG.width, fy * IMG.height];
const toStage = ([x, y]) => [x / IMG.width, y / IMG.height];

function build() {
  const root = el("section", "lab exam-q moon-q mega-q");
  const status = el("div", "q-state");
  ui.state = el("span", "difficulty", "Нет ответа");
  ui.pts = el("span", "difficulty", "Балл: —");
  status.append(ui.state, ui.pts);
  const top = el("div", "lab-top"); top.append(el("span", "eyebrow", "КАРТА МИРА · ОБСЕРВАТОРИИ"), status);

  ui.stage = el("div", "stage moon-stage mega-stage");
  Object.assign(ui.stage.style, { aspectRatio: `${IMG.width}/${IMG.height}`, position: "relative", overflow: "hidden" });
  const img = el("img"); img.src = IMG.src; img.alt = "Карта мира"; img.draggable = false;
  ui.ref = document.createElementNS(NS, "svg");
  ui.ref.setAttribute("viewBox", `0 0 ${IMG.width} ${IMG.height}`);
  ui.ref.setAttribute("class", "moon-ref"); ui.ref.hidden = true;
  ui.lead = document.createElementNS(NS, "svg");
  ui.lead.setAttribute("class", "moon-lead"); ui.lead.setAttribute("preserveAspectRatio", "none");
  ui.layer = el("div", "layer");
  ui.stage.append(img, ui.ref, ui.lead, ui.layer);
  ui.stage.ondragstart = (e) => e.preventDefault();
  ui.tray = el("div", "moon-tray");

  const header = el("div", "assignment-header");
  header.append(
    el("span", "eyebrow", "MEGA SCIENCE"),
    el("h2", "", "Где находятся\nобсерватории?"),
    el("p", "prompt", "Перетащите маркеры с названиями обсерваторий в соответствующие области карты. Достаточно попасть в круг вокруг обсерватории. Чтобы убрать маркер — перетащите его за пределы карты или дважды щёлкните по нему."),
    el("p", "prompt", "Каждая обсерватория — 1 балл. Ла-Силья и Серро-Тололо находятся совсем рядом, поэтому их области на карте перекрываются."),
  );
  header.children[1].style.whiteSpace = "pre-line";
  ui.list = el("ul", "ex-list moon-list");
  const aside = el("aside", "assignment"); aside.append(header, ui.list);

  ui.feedback = el("div", "feedback"); ui.feedback.hidden = true;
  const mapCol = el("div", "map-column mega-col"); mapCol.append(ui.stage, ui.tray);
  const body = el("div", "lab-body mega-body"); body.append(mapCol, aside);
  root.append(top, body, ui.feedback);
  $("mega").replaceChildren(root);

  for (const item of items) {
    const li = el("li", "ex-row");
    li.append(el("span", "name", item.name), (item.badge = el("span", "moon-badge")));
    ui.list.append(li);
    const chip = el("div", "moon-chip"); chip.append(el("i"), el("span", "", item.name));
    chip.onpointerdown = (e) => startDrag(e, item, null);
    item.chip = chip;
  }
  ui.tray.append(...[...items].sort(() => Math.random() - 0.5).map((i) => i.chip));
  refresh();
}

function markerNode(item) {
  const node = el("div", "mk"); node.append(el("i"));
  const [fx, fy] = toStage(state.placed[item.id]);
  node.style.left = fx * 100 + "%"; node.style.top = fy * 100 + "%";
  node.title = item.name;
  if (state.checked) { node.classList.add(item.ok ? "good" : "bad"); node.style.cursor = "default"; }
  else {
    node.onpointerdown = (e) => startDrag(e, item, node);
    node.ondblclick = () => { delete state.placed[item.id]; refresh(); };
  }
  return node;
}

// Раскладка подписей без наложений: для каждой подписи перебираем позиции вокруг точки по кольцам,
// берём первую, которая не пересекает уже поставленные подписи и значки маркеров.
let measureCtx = null;
const textW = (t) => { measureCtx = measureCtx || document.createElement("canvas").getContext("2d"); measureCtx.font = "10px system-ui, sans-serif"; return Math.ceil(measureCtx.measureText(t).width) + 12; };
function layoutLabels(specs, S, Hh) {
  const h = 16, placed = [], out = [];
  const icons = specs.map((s) => ({ x: s.x - 9, y: s.y - 9, w: 18, h: 18 }));
  const hits = (b, o) => b.x < o.x + o.w + 2 && b.x + b.w + 2 > o.x && b.y < o.y + o.h + 1 && b.y + b.h + 1 > o.y;
  for (const s of specs) {
    const w = textW(s.text);
    let best = null;
    for (let k = 0; k < 9 && !best; k++) {
      const d = 11 + k * (h + 3), c = [[d, -h / 2], [-d - w, -h / 2], [-w / 2, -d - h], [-w / 2, d], [d, -d - h], [-d - w, -d - h], [d, d], [-d - w, d], [d, -h / 2 - h - 3], [d, -h / 2 + h + 3], [-d - w, -h / 2 - h - 3], [-d - w, -h / 2 + h + 3]];
      for (const [dx, dy] of c) {
        const b = { x: s.x + dx, y: s.y + dy, w, h };
        if (b.x < 0 || b.y < 0 || b.x + w > S || b.y + h > Hh) continue;
        if (placed.some((o) => hits(b, o)) || icons.some((o) => hits(b, o))) continue;
        best = b; break;
      }
    }
    if (!best) best = { x: Math.min(Math.max(s.x + 11, 0), S - w), y: Math.min(Math.max(s.y - h / 2, 0), Hh - h), w, h };
    placed.push(best); out.push({ ...s, box: best });
  }
  return out;
}

function startDrag(e, item, from) {
  if (state.checked || e.button > 0) return;
  e.preventDefault();
  const ghost = el("div", "mk moon-float"); ghost.append(el("i"), el("span", "", item.name));
  document.body.append(ghost);
  if (from) from.style.visibility = "hidden";
  const move = (ev) => { ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; };
  const up = (ev) => {
    removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
    ghost.remove();
    const r = ui.stage.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
    if (ev.type !== "pointercancel" && fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) state.placed[item.id] = toImage(fx, fy);
    else if (from) delete state.placed[item.id];
    refresh();
  };
  move(e);
  addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
}

function refresh() {
  for (const item of items) {
    const p = state.placed[item.id];
    item.ok = Boolean(p) && hit(item, p);
    item.points = state.checked && item.ok ? WEIGHT : 0;
    item.chip.hidden = Boolean(p);
  }
  ui.tray.classList.toggle("empty", items.every((i) => state.placed[i.id]));
  ui.layer.replaceChildren(); ui.lead.replaceChildren(); ui.ref.replaceChildren(); ui.ref.hidden = !state.checked;
  const S = ui.stage.clientWidth || 800, Hh = ui.stage.clientHeight || (S * IMG.height) / IMG.width;
  ui.lead.setAttribute("viewBox", `0 0 ${S} ${Hh}`);
  const specs = [];
  for (const item of items) if (state.placed[item.id]) {
    ui.layer.append(markerNode(item));
    const [fx, fy] = toStage(state.placed[item.id]);
    specs.push({ x: fx * S, y: fy * Hh, text: item.name, cls: state.checked ? (item.ok ? "good" : "bad") : "" });
  }
  if (state.checked) for (const item of items) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", item.center[0]); c.setAttribute("cy", item.center[1]); c.setAttribute("r", item.r);
    ui.ref.append(c);
    if (item.ok) continue; // у верного ответа подпись уже есть у зелёного маркера
    const ref = el("div", "ref"); ref.append(el("i"));
    const [fx, fy] = toStage(item.center);
    ref.style.left = fx * 100 + "%"; ref.style.top = fy * 100 + "%"; ui.layer.append(ref);
    specs.push({ x: fx * S, y: fy * Hh, text: item.name, cls: "ref" });
  }
  for (const L of layoutLabels(specs, S, Hh)) {
    const b = L.box, line = document.createElementNS(NS, "line");
    line.setAttribute("x1", L.x); line.setAttribute("y1", L.y);
    line.setAttribute("x2", Math.min(Math.max(L.x, b.x), b.x + b.w)); line.setAttribute("y2", Math.min(Math.max(L.y, b.y), b.y + b.h));
    ui.lead.append(line);
    const tag = el("div", "mega-lbl" + (L.cls ? " " + L.cls : ""), L.text);
    tag.style.left = (b.x / S) * 100 + "%"; tag.style.top = (b.y / Hh) * 100 + "%";
    ui.layer.append(tag);
  }
  for (const item of items) {
    const placed = Boolean(state.placed[item.id]);
    item.badge.textContent = state.checked ? `${item.points} из ${WEIGHT}` : placed ? "на карте" : "";
    item.badge.className = "moon-badge" + (state.checked ? (item.ok ? " ok" : " bad") : placed ? " on" : "");
  }
  const count = Object.keys(state.placed).length, total = items.reduce((s, i) => s + i.points, 0);
  ui.state.textContent = state.checked ? "Проверено" : count ? `Отмечено: ${count} из ${items.length}` : "Нет ответа";
  ui.pts.textContent = state.checked ? `Балл: ${total} из ${MAX}` : "Балл: —";
  if (!state.checked) { ui.feedback.hidden = true; $("summary").hidden = true; }
}

function check() {
  if (state.checked) return;
  state.checked = true; refresh();
  const total = items.reduce((s, i) => s + i.points, 0);
  ui.feedback.hidden = false;
  ui.feedback.className = "feedback" + (total / MAX > 0.85 ? " ok" : "");
  const ul = el("ul");
  for (const item of items) ul.append(el("li", "", `${item.ok ? "✓" : "✗"} ${item.name}: ${item.points} из ${WEIGHT} — ${item.ok ? "попадание" : state.placed[item.id] ? "мимо области" : "не отмечено"}`));
  ui.feedback.replaceChildren(el("div", "", total / MAX > 0.85 ? "Ваш ответ верный." : total / MAX > 0.3 ? "Ваш ответ частично правильный." : "Ваш ответ неправильный."), ul);
  $("summary").hidden = false; $("summary").textContent = `Итого: ${total} из ${MAX} баллов`;
}

function select(m) {
  mode = m;
  items = MEGA_ITEMS.filter((i) => mode === "all" || i.group === mode).map((i) => ({ ...i }));
  MAX = items.length * WEIGHT;
  state.placed = {}; state.checked = false;
  $("mode").textContent = "Режим: " + MEGA_MODES.find((x) => x.id === mode).title;
  build();
}

function openModeDialog() {
  const dlg = $("mode-dialog"), box = el("div", "mode-box");
  box.append(el("h2", "", "Режим"), el("p", "fine", "Какие обсерватории искать на карте?"));
  for (const m of MEGA_MODES) {
    const n = MEGA_ITEMS.filter((i) => m.id === "all" || i.group === m.id).length;
    const b = el("button", "mode-opt" + (m.id === mode ? " on" : "")); b.type = "button";
    b.append(el("strong", "", `${m.title} · ${n}`), el("span", "", m.note));
    b.onclick = () => { dlg.close(); if (m.id !== mode) select(m.id); };
    box.append(b);
  }
  const close = el("button", "secondary", "Отмена"); close.type = "button"; close.onclick = () => dlg.close();
  box.append(close); dlg.replaceChildren(box); dlg.showModal();
}

let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(refresh, 120); });
$("check").onclick = check;
$("reset").onclick = () => select(mode);
$("mode").onclick = openModeDialog;
$("mode-dialog").addEventListener("click", (e) => { if (e.target.id === "mode-dialog") e.target.close(); });
select("all");

$("study").onclick = () =>
  openStudy({
    host: document.querySelector("main"),
    hide: [document.querySelector(".exam-bar"), $("mega"), $("summary")],
    sets: [{ id: "map", title: "Карта мира", image: IMG, items: MEGA_ITEMS }],
    filters: MEGA_MODES.map((m) => ({ id: m.id, title: m.id === "all" ? "Все" : m.id === "ru" ? "Россия" : "Мир", test: (i) => m.id === "all" || i.group === m.id })),
  });

$("cards").onclick = () =>
  openObsCards({
    host: document.querySelector("main"),
    hide: [document.querySelector(".exam-bar"), $("mega"), $("summary")],
    items: MEGA_ITEMS,
    filters: MEGA_MODES.map((m) => ({ id: m.id, title: m.id === "all" ? "Все" : m.id === "ru" ? "Россия" : "Мир", test: (i) => m.id === "all" || i.group === m.id })),
  });

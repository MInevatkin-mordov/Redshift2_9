// Режим «Изучение» для Луны и Mega Science: «Обзор» (все области на фото, подписи по наведению/клику)
// и «Тренировка» («Где находится X?» — кликни по фото, сразу видно верно/мимо, ошибки повторяются чаще).
const NS = "http://www.w3.org/2000/svg";
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const sv = (tag, attrs = {}, cls = "") => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute("class", cls); return e; };

function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const hit = (it, p) => (it.poly ? inPoly(p, it.poly) : Math.hypot(p[0] - it.center[0], p[1] - it.center[1]) <= it.r);
const area = (it) => (it.poly ? Math.abs(it.poly.reduce((s, [x, y], i) => { const [x2, y2] = it.poly[(i + 1) % it.poly.length]; return s + x * y2 - x2 * y; }, 0)) / 2 : Math.PI * it.r * it.r);
const pick = (items, p) => items.filter((i) => hit(i, p)).sort((a, b) => area(a) - area(b))[0];
const shape = (it) => (it.poly ? sv("polygon", { points: it.poly.map((q) => q.join(",")).join(" ") }) : sv("circle", { cx: it.center[0], cy: it.center[1], r: it.r }));

export function openStudy({ host, hide, sets, filters }) {
  const prev = hide.map((e) => e.hidden);
  hide.forEach((e) => (e.hidden = true));
  const root = el("section", "st");
  host.append(root);
  const S = { set: sets[0], filter: filters[0], mode: "browse", sel: null, labels: false };
  let T = null, timer = 0;
  const itemsOf = () => (typeof S.set.items === "function" ? S.set.items() : S.set.items).filter(S.filter.test);
  const close = () => { clearTimeout(timer); removeEventListener("keydown", onKey); root.remove(); hide.forEach((e, i) => (e.hidden = prev[i])); };
  const onKey = (e) => { if (S.mode === "train" && T?.answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); } else if (e.key === "Escape") close(); };
  addEventListener("keydown", onKey);

  let items = [], ui = {};
  function newTrain() { clearTimeout(timer); T = { asked: 0, ok: 0, streak: 0, best: 0, miss: {}, cur: null, last: null, answered: false }; }
  function next() {
    clearTimeout(timer);
    const pool = items.filter((i) => i !== T.last || items.length < 2);
    const w = pool.map((i) => 1 + 3 * (T.miss[i.id] || 0));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0;
    while (r > w[k] && k < pool.length - 1) r -= w[k++];
    T.cur = T.last = pool[k]; T.answered = false;
    ui.marks.replaceChildren(); ui.labels.replaceChildren(); ui.svg.querySelectorAll(".st-shape").forEach((s) => s.remove());
    side();
  }
  function toImg(ev) {
    const r = ui.svg.getBoundingClientRect(), W = S.set.image.width, H = S.set.image.height;
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H];
  }
  function label(it, cls = "") {
    const W = S.set.image.width, H = S.set.image.height, t = el("div", "st-lbl " + cls, it.name);
    t.style.left = Math.min(Math.max((it.center[0] / W) * 100, 12), 88) + "%";
    t.style.top = Math.max((it.center[1] / H) * 100, 6) + "%";
    return t;
  }
  function draw() {
    ui.svg.replaceChildren(); ui.labels.replaceChildren();
    if (S.mode === "browse") {
      for (const it of [...items].sort((a, b) => area(b) - area(a))) {
        const s = shape(it); s.setAttribute("class", `st-shape ${it.kind}${S.sel === it ? " on" : ""}`); s.dataset.id = it.id; ui.svg.append(s);
        if (S.labels && S.sel !== it) ui.labels.append(label(it));
      }
      if (S.sel) ui.labels.append(label(S.sel, "on"));
    }
    ui.marks = sv("g"); ui.svg.append(ui.marks);
  }
  function answer(p) {
    if (!T.cur || T.answered) return;
    T.answered = true; T.asked++;
    const ok = hit(T.cur, p);
    if (ok) { T.ok++; T.streak++; T.best = Math.max(T.best, T.streak); } else { T.streak = 0; T.miss[T.cur.id] = (T.miss[T.cur.id] || 0) + 1; }
    const s = shape(T.cur); s.setAttribute("class", "st-shape on " + T.cur.kind); ui.svg.insertBefore(s, ui.marks);
    ui.marks.append(sv("circle", { cx: p[0], cy: p[1], r: Math.max(S.set.image.width / 160, 4) }, ok ? "st-dot ok" : "st-dot bad"));
    ui.labels.replaceChildren(label(T.cur, "on"));
    side(ok);
    if (ok) { const q = T.cur; timer = setTimeout(() => T?.cur === q && T.answered && next(), 1000); }
  }
  function side(ok) {
    const box = ui.side; box.replaceChildren();
    if (S.mode === "browse") {
      const info = el("div", "st-info");
      info.append(el("span", "eyebrow", S.sel ? (S.sel.kind === "crater" ? "КРАТЕР" : S.sel.kind === "sea" ? "МОРЕ" : "ОБСЕРВАТОРИЯ") : "ОБЗОР"), el("h3", "", S.sel ? S.sel.name : "Выбери объект"), el("p", "fine", S.sel ? "Запомни форму и положение области на фото." : "Наведи курсор на область фото или выбери название из списка. Область подсветится зелёным."));
      const lab = el("label", "st-check"), cb = el("input"); cb.type = "checkbox"; cb.checked = S.labels; cb.onchange = () => { S.labels = cb.checked; draw(); };
      lab.append(cb, document.createTextNode(" Показать все подписи")); info.append(lab);
      const list = el("div", "st-list");
      for (const it of [...items].sort((a, b) => a.name.localeCompare(b.name, "ru"))) {
        const b = el("button", "st-item" + (S.sel === it ? " on" : ""), it.name); b.type = "button";
        b.onclick = () => { S.sel = it; draw(); side(); }; list.append(b);
      }
      box.append(info, list); return;
    }
    const q = el("div", "st-info");
    if (!T.cur) {
      q.append(el("span", "eyebrow", "ТРЕНИРОВКА"), el("h3", "", "Найди на фото"), el("p", "fine", `Тебе называют объект — кликни по нужному месту на фото. ${items.length} объектов; ошибки повторяются чаще. Enter или пробел — дальше.`));
      const go = el("button", "primary", "Начать"); go.type = "button"; go.onclick = next; q.append(go);
    } else {
      q.append(el("span", "eyebrow", T.answered ? (ok ? "ВЕРНО ✓" : "МИМО ✗") : "ГДЕ НАХОДИТСЯ?"), el("h3", "st-ask", T.cur.name));
      q.append(el("p", "fine", T.answered ? (ok ? "Отлично! Следующий через секунду…" : "Правильная область подсвечена зелёным, красная точка — твой клик.") : "Кликни по фото."));
      if (T.answered) { const n = el("button", "primary", "Дальше →"); n.type = "button"; n.onclick = next; q.append(n); }
    }
    const st = el("div", "st-stats");
    st.append(el("div", "", `Верно: ${T.ok} из ${T.asked}`), el("div", "", `Серия: ${T.streak} · рекорд: ${T.best}`));
    const weak = items.filter((i) => T.miss[i.id]).sort((a, b) => T.miss[b.id] - T.miss[a.id]).slice(0, 8);
    if (weak.length) st.append(el("div", "fine", "Повторить: " + weak.map((i) => i.name).join(", ")));
    box.append(q, st);
  }
  function render() {
    items = itemsOf(); root.replaceChildren();
    const bar = el("div", "st-bar");
    const tabs = (arr, cur, set) => { const g = el("div", "st-seg"); for (const x of arr) { const b = el("button", x === cur ? "on" : "", x.title); b.type = "button"; b.onclick = () => { set(x); }; g.append(b); } return g; };
    const reset = () => { S.sel = null; newTrain(); render(); };
    if (sets.length > 1) bar.append(tabs(sets, S.set, (x) => { S.set = x; reset(); }));
    if (filters.length > 1) bar.append(tabs(filters, S.filter, (x) => { S.filter = x; reset(); }));
    bar.append(tabs([{ title: "Обзор", id: "browse" }, { title: "Тренировка", id: "train" }], { title: S.mode === "browse" ? "Обзор" : "Тренировка" }, (x) => { S.mode = x.id; S.sel = null; newTrain(); render(); }));
    const ex = el("button", "secondary", "← К заданию"); ex.type = "button"; ex.onclick = close; ex.style.marginLeft = "auto"; bar.append(ex);
    const body = el("div", "st-body"), main = el("div", "st-main"), { width: W, height: H, src } = S.set.image;
    const stage = el("div", "st-stage"); stage.style.width = `min(100%, ${Math.round((760 * W) / H)}px)`; stage.style.aspectRatio = `${W}/${H}`;
    const img = el("img"); img.src = src; img.alt = S.set.title; img.draggable = false;
    ui.svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-svg" }); ui.labels = el("div", "st-labels");
    stage.append(img, ui.svg, ui.labels); main.append(stage);
    ui.side = el("aside", "st-side"); body.append(main, ui.side); root.append(bar, body);
    draw();
    ui.svg.onpointermove = (e) => { if (S.mode !== "browse") return; const it = pick(items, toImg(e)); ui.svg.style.cursor = it ? "pointer" : "default"; ui.svg.querySelectorAll(".st-shape").forEach((s) => s.classList.toggle("hv", it && s.dataset.id === it.id)); };
    ui.svg.onclick = (e) => { const p = toImg(e); if (S.mode === "browse") { const it = pick(items, p); S.sel = it || null; draw(); side(); } else answer(p); };
    side();
  }
  newTrain(); render();
}

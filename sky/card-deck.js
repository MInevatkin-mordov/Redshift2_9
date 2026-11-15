// Универсальные карточки: сетка · изучение (переворот) · по фото (ввести название) · по названию (выбрать фото).
// Используется для обсерваторий (Mega Science) и объектов Мессье (Небо → Карточки).

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => s.toLowerCase().replace(/ё/g, "е").replace(/й/g, "и").replace(/[^a-zа-я0-9]/g, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

export const nameOk = (answers, s) => { const y = norm(s); return y.length > 0 && answers.filter(Boolean).some((n) => { const x = norm(String(n)); return x === y || (x.length > 4 && lev(x, y) <= 1); }); };

export function openCards({ host, hide = [], items, filters, pic, answers, sub = () => "", extra = [], closeLabel = "", search = false, labels = {} }) {
  const L = { ask: "Как называется этот объект?", ph: "Название", pick: "Выберите изображение этого объекта.", few: "Для этого режима нужно хотя бы две карточки.", ...labels };
  const prev = hide.map((e) => e.hidden);
  hide.forEach((e) => (e.hidden = true));
  const root = el("section", "st oc");
  host.append(root);
  const S = { mode: "grid", filter: filters[0], count: 10 };
  const close = () => { removeEventListener("keydown", onKey); root.remove(); hide.forEach((e, i) => (e.hidden = prev[i])); };
  const onKey = (e) => { if (e.key === "Escape" && closeLabel) close(); };
  addEventListener("keydown", onKey);

  const MODES = [["grid", labels.grid || "🃏 Карточки"], ["study", "📖 Изучение"], ["photo", "🖼 По фото"], ["name", "🔤 По названию"]];
  const pool = () => items.filter(S.filter.test);

  function seg(list, cur, on) {
    const box = el("div", "st-seg");
    for (const [v, t] of list) { const b = el("button", v === cur ? "on" : "", t); b.type = "button"; b.onclick = () => on(v); box.append(b); }
    return box;
  }
  function shell() {
    const bar = el("div", "st-bar");
    bar.append(seg(MODES, S.mode, (v) => { S.mode = v; render(); }));
    bar.append(seg(filters.map((f) => [f.id, f.title]), S.filter.id, (v) => { S.filter = filters.find((f) => f.id === v); render(); }));
    if (S.mode === "photo" || S.mode === "name") bar.append(seg([[5, "5"], [10, "10"], [20, "20"], [0, "Все"]], S.count, (v) => { S.count = v; render(); }));
    for (const e of extra) { const a = el("a", "secondary oc-link", e.label); a.href = e.href; bar.append(a); }
    if (closeLabel) { const x = el("button", "secondary", closeLabel); x.type = "button"; x.onclick = close; bar.append(x); }
    const body = el("div", "oc-body");
    root.replaceChildren(bar, body);
    return body;
  }
  const render = () => {
    const body = shell();
    if (S.mode === "grid") grid(body); else if (S.mode === "study") study(body); else quiz(body, S.mode);
  };

  // ── Сетка карточек: изображение + название ──
  function grid(body) {
    const g = el("div", "oc-grid"), cnt = el("p", "fine oc-count");
    let box = null;
    if (search) { box = el("input", "oc-search"); box.type = "search"; box.placeholder = "Поиск: M31, Андромеды, туманность…"; box.value = S.q || ""; box.oninput = () => { S.q = box.value; draw(); }; body.append(box); }
    const draw = () => {
      const t = norm(S.q || ""), list = pool().filter((o) => !t || norm([o.name, ...answers(o), sub(o)].join(" ")).includes(t));
      g.replaceChildren();
      for (const o of list) { const c = el("article", "oc-card"); c.innerHTML = pic(o); c.append(el("h3", "", o.name)); const s2 = sub(o); if (s2) c.append(el("p", "oc-sub", s2)); g.append(c); }
      cnt.textContent = `Показано: ${list.length} из ${items.length}`;
    };
    body.append(cnt, g); draw();
  }

  // ── Изучение: перевернуть карточку, чтобы увидеть название ──
  function study(body, deck = shuffle(pool()), i = 0) {
    if (!deck.length) return;
    const o = deck[i], wrap = el("div", "oc-study");
    wrap.innerHTML = `<div class="oc-prog">${i + 1} / ${deck.length}</div>
    <div class="oc-flip" tabindex="0"><div class="oc-face oc-front">${pic(o, true)}<small>Нажми, чтобы увидеть название</small></div><div class="oc-face oc-back"><h2></h2><p class="oc-sub"></p></div></div>`;
    wrap.querySelector("h2").textContent = o.name; wrap.querySelector(".oc-back .oc-sub").textContent = sub(o);
    const flip = wrap.querySelector(".oc-flip"), toggle = () => flip.classList.toggle("on");
    flip.onclick = toggle; flip.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
    const row = el("div", "oc-row");
    const back = el("button", "secondary", "← Назад"); back.type = "button"; back.disabled = i === 0; back.onclick = () => { body.replaceChildren(); study(body, deck, i - 1); };
    const nx = el("button", "primary", i === deck.length - 1 ? "Заново ↻" : "Дальше →"); nx.type = "button";
    nx.onclick = () => { body.replaceChildren(); study(body, i === deck.length - 1 ? shuffle(pool()) : deck, i === deck.length - 1 ? 0 : i + 1); };
    row.append(back, nx); wrap.append(row); body.append(wrap);
  }

  // ── Тесты: «По фото» (вписать название) и «По названию» (выбрать фото) ──
  function quiz(body, kind) {
    const all = pool(), n = S.count ? Math.min(S.count, all.length) : all.length;
    const deck = shuffle(all).slice(0, n), log = [];
    if (!all.length) { body.append(el("p", "fine", "Нет карточек для выбранного фильтра.")); return; }
    if (kind === "name" && all.length < 2) { body.append(el("p", "fine", L.few)); return; }
    const step = (i) => {
      if (i >= deck.length) return result(body, log, () => quiz(body, kind));
      const o = deck[i], box = el("div", "oc-q"); // eslint-disable-line
      body.replaceChildren(box);
      box.append(el("div", "oc-prog", `${i + 1} / ${deck.length}`));
      const done = (good, shown) => {
        log.push({ o, good });
        const fb = el("p", "oc-fb " + (good ? "ok" : "bad"), good ? "✓ Верно" : `✗ Правильный ответ: ${o.name}`);
        box.append(fb);
        const nx = el("button", "primary", i === deck.length - 1 ? "Результат →" : "Дальше →"); nx.type = "button"; nx.onclick = () => step(i + 1);
        box.append(nx); nx.focus();
        return shown;
      };
      if (kind === "photo") {
        const card = el("div", "oc-card oc-solo"); card.innerHTML = pic(o, true); box.append(card, el("p", "fine oc-ask", L.ask));
        const f = el("form", "oc-form"), inp = el("input"); inp.placeholder = L.ph; inp.autocomplete = "off";
        const go = el("button", "primary", "Проверить"); go.type = "submit"; f.append(inp, go); box.append(f); inp.focus();
        f.onsubmit = (e) => { e.preventDefault(); const good = nameOk(answers(o), inp.value); inp.disabled = go.disabled = true; card.append(el("h3", "", o.name)); done(good); };
      } else {
        box.append(el("h2", "oc-big", o.name), el("p", "fine oc-ask", L.pick));
        const opts = shuffle([o, ...shuffle(all.filter((x) => x !== o)).slice(0, 3)]), g = el("div", "oc-opts");
        for (const x of opts) {
          const b = el("button", "oc-opt"); b.type = "button"; b.innerHTML = pic(x, true);
          b.onclick = () => { g.querySelectorAll("button").forEach((q) => (q.disabled = true)); b.classList.add(x === o ? "good" : "bad"); if (x !== o) g.children[opts.indexOf(o)].classList.add("good"); done(x === o); };
          g.append(b);
        }
        box.append(g);
      }
    };
    step(0);
  }
  function result(body, log, again) {
    const n = log.filter((l) => l.good).length, box = el("div", "oc-q");
    box.append(el("h2", "oc-big", `${n} / ${log.length}`), el("p", "fine", n === log.length ? "Отлично!" : n >= log.length / 2 ? "Хороший результат — повторите ошибки." : "Продолжайте тренироваться."));
    const ul = el("ul", "oc-res");
    for (const l of log) ul.append(el("li", l.good ? "ok" : "bad", `${l.good ? "✓" : "✗"} ${l.o.name}`));
    const b = el("button", "primary", "Ещё раз"); b.type = "button"; b.onclick = () => { body.replaceChildren(); again(); };
    box.append(ul, b); body.replaceChildren(box);
  }
  render();
}

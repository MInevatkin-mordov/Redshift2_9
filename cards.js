import { OBJECTS, REGIONS, fmt } from "./data.js";
import { pic } from "./art.js";

const FIELDS = [
  { k: "r", label: "Радиус", unit: "км", ph: "напр. 476", tip: "±5 %" },
  { k: "a", label: "Большая полуось", unit: "а. е.", ph: "напр. 2,77", tip: "±5 %" },
  { k: "moons", label: "Число спутников", unit: "", ph: "0, 1, 2…", tip: "точно" },
  { k: "region", label: "Область", unit: "", ph: "", tip: "выбор" },
];
const lab = (k) => k === "name" ? "Название" : FIELDS.find((f) => f.k === k).label;
const norm = (s) => s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
export const nameOk = (o, s) => [o.name, o.en].some((n) => { const x = norm(n), y = norm(s); return y && (x === y || (x.length > 4 && lev(x, y) <= 1)); });
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const num = (s) => parseFloat(String(s).replace(",", ".").replace(/\s/g, ""));
const val = (o, k) => k === "moons" ? o.moons.length : k === "region" ? o.region : o[k];
const show = (o, k) => { const f = FIELDS.find((x) => x.k === k); const v = val(o, k); return typeof v === "number" ? `${fmt(v)} ${f.unit}`.trim() : v; };
const ok = (o, k, s) => {
  if (k === "region") return s === o.region;
  const g = num(s); if (isNaN(g)) return false;
  return k === "moons" ? g === o.moons.length : Math.abs(g - o[k]) <= o[k] * 0.05;
};

export function mountCards(root) {
  const S = { mode: 1, set: "official", count: 5, fields: ["r", "a", "moons"] };
  const settings = () => {
    root.innerHTML = `<section class="panel narrow"><h1>🃏 Карточки</h1><p class="sub">Запомни характеристики карликовых планет.</p>
    <div class="seg" id="mode">${[[1, "🖼️ Режим 1 — по фото"], [2, "🔤 Режим 2 — по названию"], [0, "📖 Изучение"]].map(([v, t]) => `<button data-v="${v}" class="${S.mode == v ? "on" : ""}">${t}</button>`).join("")}</div>
    <label class="lbl">Набор</label><div class="seg" id="set">${[["official", "5 официальных"], ["all", "Все 10"]].map(([v, t]) => `<button data-v="${v}" class="${S.set == v ? "on" : ""}">${t}</button>`).join("")}</div>
    <label class="lbl">Число карточек</label><div class="seg" id="cnt">${[5, 10].map((v) => `<button data-v="${v}" class="${S.count == v ? "on" : ""}">${v}</button>`).join("")}</div>
    <div id="fl" ${S.mode === 2 ? "" : "hidden"}><label class="lbl">Характеристики</label><div class="chips">${FIELDS.map((f) => `<label class="chip"><input type="checkbox" value="${f.k}" ${S.fields.includes(f.k) ? "checked" : ""}> ${f.label}</label>`).join("")}</div></div>
    <button class="btn big" id="go">🚀 Начать</button></section>`;
    const seg = (id, key, cast) => root.querySelectorAll(`#${id} button`).forEach((b) => b.onclick = () => { S[key] = cast(b.dataset.v); settings(); });
    seg("mode", "mode", Number); seg("set", "set", String); seg("cnt", "count", Number);
    root.querySelectorAll("#fl input").forEach((c) => c.onchange = () => { S.fields = [...root.querySelectorAll("#fl input:checked")].map((x) => x.value); });
    root.querySelector("#go").onclick = () => { if (S.mode === 2 && !S.fields.length) return; start(); };
  };

  function start() {
    const pool = S.set === "official" ? OBJECTS.filter((o) => o.status === "official") : OBJECTS;
    const deck = shuffle(pool).slice(0, S.count);
    if (S.mode === 0) return study(deck, 0);
    run(deck, 0, [], pool);
  }

  function study(deck, i) {
    if (i >= deck.length) return settings();
    const o = deck[i];
    root.innerHTML = `<section class="panel narrow"><div class="prog">${i + 1} / ${deck.length}</div>
    <div class="flip" id="fp"><div class="face front">${pic(o)}<h2>${o.name}</h2><small>${o.en} · нажми, чтобы перевернуть</small></div>
    <div class="face back"><h2>${o.name}</h2><dl>${FIELDS.map((f) => `<dt>${f.label}</dt><dd>${show(o, f.k)}</dd>`).join("")}</dl>${o.moons.length ? `<p class="mn">${o.moons.join(", ")}</p>` : ""}</div></div>
    <div class="row"><button class="btn ghost" id="ex">← Выйти</button><button class="btn" id="nx">Дальше →</button></div></section>`;
    root.querySelector("#fp").onclick = (e) => e.currentTarget.classList.toggle("on");
    root.querySelector("#nx").onclick = () => study(deck, i + 1);
    root.querySelector("#ex").onclick = settings;
  }

  function run(deck, i, log, pool) {
    if (i >= deck.length) return results(log);
    const o = deck[i], head = `<div class="prog">${i + 1} / ${deck.length}</div>`;
    if (S.mode === 1) {
      root.innerHTML = `<section class="panel narrow">${head}${pic(o, true)}<p class="sub c">Как называется этот объект?</p><form id="f"><input name="name" autocomplete="off" autofocus placeholder="Название (рус. или англ.)"><button class="btn big">Проверить</button></form></section>`;
      root.querySelector("input").focus();
      root.querySelector("#f").onsubmit = (e) => {
        e.preventDefault();
        const g = new FormData(e.target).get("name").trim(), res = [{ k: "name", g, good: nameOk(o, g) }];
        log.push({ o, res, good: res[0].good });
        root.querySelector("form").outerHTML = `${compare(o, res)}<button class="btn big" id="nx">Дальше →</button>`;
        root.querySelector("#nx").onclick = () => run(deck, i + 1, log, pool);
        root.querySelector("#nx").focus();
      };
      return;
    }
    const prompt = S.mode === 1 ? `${pic(o, true)}<p class="sub c">Что это за объект? Введи его характеристики.</p>` : `<h2 class="big-name">${o.name}</h2><p class="sub c">${o.en}</p>`;
    root.innerHTML = `<section class="panel narrow">${head}${prompt}<form id="f">${S.fields.map((k) => {
      const f = FIELDS.find((x) => x.k === k);
      return `<label class="lbl">${f.label}${f.unit ? ", " + f.unit : ""} <em>${f.tip}</em></label>` + (k === "region" ? `<select name="${k}"><option value="">—</option>${REGIONS.map((r) => `<option>${r}</option>`).join("")}</select>` : `<input name="${k}" inputmode="decimal" autocomplete="off" placeholder="${f.ph}">`);
    }).join("")}<button class="btn big">Проверить</button></form></section>`;
    root.querySelector("#f").onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target), res = S.fields.map((k) => ({ k, g: (fd.get(k) || "").trim(), good: ok(o, k, (fd.get(k) || "").trim()) }));
      log.push({ o, res, good: res.every((r) => r.good) });
      root.querySelector("form").outerHTML = `${compare(o, res)}<button class="btn big" id="nx">Дальше →</button>`;
      root.querySelector("#nx").onclick = () => run(deck, i + 1, log, pool);
    };
  }

  const compare = (o, res) => `<table class="cmp"><thead><tr><th></th><th>Твой ответ</th><th>Правильный</th></tr></thead><tbody>${res.map((r) => `<tr class="${r.good ? "good" : "bad"}"><td>${lab(r.k)}</td><td>${r.good ? "✓" : "✗"} ${r.g || "—"}</td><td>${r.k === "name" ? o.name : show(o, r.k)}</td></tr>`).join("")}</tbody></table>`;

  function results(log) {
    const n = log.filter((l) => l.good).length;
    root.innerHTML = `<section class="panel narrow"><h1 class="c">${n} / ${log.length}</h1><p class="sub c">${n === log.length ? "Идеально! 🌟" : n >= log.length / 2 ? "Хороший результат — повтори ошибки." : "Продолжай тренироваться!"}</p>
    ${log.map((l) => `<h3 class="rn ${l.good ? "good" : "bad"}">${l.good ? "✓" : "✗"} ${l.o.name}</h3>${compare(l.o, l.res)}`).join("")}
    <div class="row"><button class="btn ghost" id="st">Настройки</button><button class="btn" id="ag">Ещё раз</button></div></section>`;
    root.querySelector("#st").onclick = settings; root.querySelector("#ag").onclick = start;
  }
  settings();
}

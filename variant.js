// Режимы «Вариант» (5 объектов на задание, можно проверять по одному) и «Экзамен» (все 10 объектов, проверка только в конце).
import { OBJECTS, REGIONS, fmt } from "./data.js";
import { pic } from "./art.js";
import { nameOk } from "./cards.js";

const num = (s) => parseFloat(String(s).replace(",", ".").replace(/\s/g, ""));
const smooth = (g, t, max) => { const x = num(g); if (isNaN(x)) return 0; const e = Math.abs(x - t) / t; return Math.round((e <= 0.02 ? 1 : e >= 0.2 ? 0 : 1 - (e - 0.02) / 0.18) * max * 10) / 10; };
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = (s) => { let a = hash(s); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuf = (R, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const STATUS = ["Официальная", "Кандидат"], st = (o) => (o.status === "official" ? STATUS[0] : STATUS[1]);
const sel = (v, c) => ({ ok: (o, x) => (x === c(o) ? 1 : 0), corr: c });

const TASKS = [
  { title: "Название по фото", hint: "Определи объект по изображению (русское или английское название).", photo: true,
    fields: [{ k: "name", label: "Название", type: "text", max: 2, ok: (o, v) => (nameOk(o, v) ? 2 : 0), corr: (o) => o.name }] },
  { title: "Радиус", hint: "В километрах. Полный балл при ошибке до 2 %, ноль — от 20 %.",
    fields: [{ k: "r", label: "Радиус, км", type: "num", max: 2, ok: (o, v) => smooth(v, o.r, 2), corr: (o) => fmt(o.r) }] },
  { title: "Большая полуось", hint: "В астрономических единицах. Полный балл при ошибке до 2 %, ноль — от 20 %.",
    fields: [{ k: "a", label: "Большая полуось, а. е.", type: "num", max: 2, ok: (o, v) => smooth(v, o.a, 2), corr: (o) => fmt(o.a) }] },
  { title: "Спутники и кольцо", hint: "Сколько у объекта известных спутников и есть ли кольцо.",
    fields: [{ k: "moons", label: "Число спутников", type: "num", max: 1, ok: (o, v) => (v !== "" && num(v) === o.moons.length ? 1 : 0), corr: (o) => o.moons.length },
      { k: "rings", label: "Кольцо", type: "sel", opts: ["есть", "нет"], max: 1, ok: (o, v) => (v === (o.rings ? "есть" : "нет") ? 1 : 0), corr: (o) => (o.rings ? "есть" : "нет") }] },
  { title: "Область и статус", hint: "Где находится объект и признан ли он карликовой планетой.",
    fields: [{ k: "region", label: "Область", type: "sel", opts: REGIONS, max: 1, ok: (o, v) => (v === o.region ? 1 : 0), corr: (o) => o.region },
      { k: "status", label: "Статус", type: "sel", opts: STATUS, max: 1, ok: (o, v) => (v === st(o) ? 1 : 0), corr: (o) => st(o) }] },
];

export function mountVariant(root, kind, seedArg) {
  const exam = kind === "exam", P = exam ? "E" : "V", N = exam ? 10 : 5;
  let seed = /^[VEve]?\d{1,12}$/.test(seedArg || "") ? P + seedArg.replace(/\D/g, "") : null;
  if (!seed) { seed = P + String((Math.random() * 1e9) | 0).padStart(9, "0"); history.replaceState(null, "", `#/${kind}/${seed.slice(1)}`); }
  const key = "rs-" + seed, R = rng(seed + kind);
  // Открытие по ссылке начинается с чистого листа; в пределах вкладки перезагрузка сохраняет ответы.
  try { const seen = "rs-seen-" + seed; if (!sessionStorage.getItem(seen)) { localStorage.removeItem(key); sessionStorage.setItem(seen, "1"); } } catch { /* необязательно */ }
  const sets = TASKS.map(() => shuf(R, OBJECTS).slice(0, N));
  const S = Object.assign({ ans: {}, done: {}, name: "" }, JSON.parse(localStorage.getItem(key) || "{}"));
  const save = () => localStorage.setItem(key, JSON.stringify(S));
  let tab = 0;
  const get = (t, id, k) => S.ans?.[t]?.[id]?.[k] ?? "";
  const maxT = (t) => N * TASKS[t].fields.reduce((s, f) => s + f.max, 0);
  const ptsT = (t) => sets[t].reduce((s, o) => s + TASKS[t].fields.reduce((q, f) => q + f.ok(o, get(t, o.id, f.k).trim()), 0), 0);
  const round = (x) => Math.round(x * 10) / 10;
  const total = () => round(TASKS.reduce((s, _, t) => s + (S.done[t] ? ptsT(t) : 0), 0));
  const max = TASKS.reduce((s, _, t) => s + maxT(t), 0);
  const doneAll = TASKS.every((_, t) => S.done[t]);

  const input = (t, o, f) => {
    const v = get(t, o.id, f.k), d = S.done[t] ? "disabled" : "", at = `data-t="${t}" data-o="${o.id}" data-k="${f.k}"`;
    return `<label class="lbl">${f.label}</label>` + (f.type === "sel" ? `<select ${at} ${d}><option value="">—</option>${f.opts.map((x) => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("")}</select>` : `<input ${at} ${d} value="${v}" autocomplete="off" ${f.type === "num" ? 'inputmode="decimal"' : ""}>`);
  };
  const rowHTML = (t, o) => {
    const T = TASKS[t], head = T.photo ? pic(o, true) : `<div class="vname"><div class="mini">${pic(o)}</div><b>${o.name}</b></div>`;
    if (!S.done[t]) return `<article class="vrow">${head}<div>${T.fields.map((f) => input(t, o, f)).join("")}</div></article>`;
    const rows = T.fields.map((f) => { const v = get(t, o.id, f.k).trim(), p = f.ok(o, v); return `<tr class="${p >= f.max ? "good" : p > 0 ? "part" : "bad"}"><td>${f.label}</td><td>${v || "—"}</td><td>${f.corr(o)}</td><td>${round(p)} / ${f.max}</td></tr>`; }).join("");
    return `<article class="vrow">${head}<table class="cmp"><thead><tr><th></th><th>Твой ответ</th><th>Правильный</th><th>Баллы</th></tr></thead><tbody>${rows}</tbody></table></article>`;
  };
  const taskHTML = () => {
    const T = TASKS[tab];
    return `<h2>${tab + 1}. ${T.title}${S.done[tab] ? ` <span class="score">${round(ptsT(tab))} / ${maxT(tab)}</span>` : ""}</h2><p class="sub">${T.hint}</p><div class="vlist">${sets[tab].map((o) => rowHTML(tab, o)).join("")}</div>` +
      (!exam && !S.done[tab] ? `<button class="btn" id="chk">Проверить это задание</button>` : "");
  };
  const draw = () => {
    root.innerHTML = `<section class="wrap"><p class="eyebrow">${exam ? "Проверь себя" : "Один seed — пять заданий"}</p><h1>${exam ? "Экзамен" : "Вариант"}</h1>
    <p class="sub">${exam ? `Пять заданий по ${N} объектов, ${max} баллов. Проверка всех ответов — только после завершения экзамена.` : `Пять заданий по ${N} объектов, ${max} баллов. Ответы сохраняются при переключении вкладок и в этом браузере.`}</p>
    <div class="panel seedbar"><button class="btn" id="gen">✧ Сгенерировать новый seed</button>
      <label class="lbl">Открыть по seed (${P}…)<input id="sd" inputmode="numeric" maxlength="13" value="${seed}"></label>
      <button class="btn ghost" id="ld">Открыть</button><button class="btn ghost" id="cp">↗ Скопировать ссылку</button></div>
    ${exam ? `<label class="lbl">Фамилия И. О.<input id="nm" maxlength="60" placeholder="Иванов И. И." value="${S.name}" ${doneAll ? "disabled" : ""}></label>` : ""}
    <div class="panel vsum"><div><p class="eyebrow">SEED ${seed}</p><h2>${exam && doneAll && S.name ? S.name + " · " : ""}Общий результат: <strong>${total()}</strong> / ${max}</h2>
      <p class="sub">${doneAll ? "Всё проверено." : exam ? "Ответы ещё не проверены." : `Проверено заданий: ${TASKS.filter((_, t) => S.done[t]).length} из 5.`}</p></div>
      ${doneAll ? "" : `<button class="btn" id="all">${exam ? "Завершить экзамен и проверить всё" : "Проверить все задания"}</button>`}</div>
    <div class="vtabs">${TASKS.map((T, t) => `<button data-tab="${t}" class="${t === tab ? "on" : ""}">${t + 1}. ${T.title}${S.done[t] ? ` <span>${round(ptsT(t))}/${maxT(t)}</span>` : ""}</button>`).join("")}</div>
    <div class="panel" id="task">${taskHTML()}</div></section>`;
    const $ = (s) => root.querySelector(s);
    root.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = +b.dataset.tab; draw(); });
    const go = (s) => { const d = (s || "").replace(/\D/g, ""); if (d) location.hash = `#/${kind}/${d.slice(0, 12)}`; };
    $("#gen").onclick = () => go(String((Math.random() * 1e9) | 0).padStart(9, "0"));
    $("#ld").onclick = () => go($("#sd").value);
    $("#cp").onclick = () => navigator.clipboard?.writeText(location.href).then(() => ($("#cp").textContent = "✓ Скопировано"));
    if ($("#nm")) $("#nm").oninput = (e) => { S.name = e.target.value; save(); };
    if ($("#chk")) $("#chk").onclick = () => { S.done[tab] = true; save(); draw(); };
    if ($("#all")) $("#all").onclick = () => { if (exam && !confirm("Завершить экзамен? После проверки ответы нельзя изменить.")) return; TASKS.forEach((_, t) => (S.done[t] = true)); save(); draw(); };
    $("#task").oninput = (e) => { const d = e.target.dataset; if (d.o === undefined) return; ((S.ans[d.t] ??= {})[d.o] ??= {})[d.k] = e.target.value; save(); };
  };
  draw();
}

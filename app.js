import { OBJECTS, byId, fmt, REGIONS } from "./data.js";
import { pic } from "./art.js";
import { mountCards } from "./cards.js";
import { mountVariant } from "./variant.js";

const app = document.getElementById("app");
const favs = new Set(JSON.parse(localStorage.getItem("rs-favs") || "[]"));
const saveFavs = () => localStorage.setItem("rs-favs", JSON.stringify([...favs]));
const stat = (o) => (o.status === "official" ? "Официальная" : "Кандидат");
const row = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
const data = (o) => row("Радиус", fmt(o.r) + " км") + row("Большая полуось", fmt(o.a) + " а. е.") + row("Период", fmt(o.T) + " лет") + row("Спутники", o.moons.length || "нет");

const Q = { q: "", status: "all", region: "all", sort: "a", fav: false };
const TILES = [
  ["#/catalog", "🪐", "Карликовые планеты", "Каталог, карточки, варианты и экзамен по 10 мирам за Нептуном", "Плутон · Эрида · Церера"],
  ["#/sky", "✨", "Небо", "Звёзды, объекты Мессье и созвездия: карты NASA, карточки с фото и квиз", "Варианты · Экзамен · Карточки · Квиз"],
  ["sky/moon.html", "🌙", "Луна", "Моря и кратеры на трёх фотографиях: полнолуние, растущая и убывающая", "55 объектов"],
  ["sky/mega.html", "🔭", "Mega Science", "Обсерватории мира на карте: от Пулкова и БТА до Мауна-Кеа", "23 обсерватории"],
];
const tile = ([href, ico, t, d, m]) => `<a class="tile" href="${href}"><span class="ti">${ico}</span><h3>${t}</h3><p>${d}</p><small>${m}</small><span class="go">Открыть →</span></a>`;
function home() {
  app.innerHTML = `<section class="hero"><div class="stars" aria-hidden="true"></div><p class="eyebrow">Тренажёр по астрономии</p><h1>Red<span>shift</span></h1>
  <p class="lead">Карликовые планеты, звёздное небо, Луна и обсерватории мира — учись, тренируйся, проверяй себя.</p>
  <div class="row c"><a class="btn big" href="#/catalog">Начать с каталога</a><a class="btn big ghost" href="#/sky">Карта неба</a></div></section>
  <section class="wrap"><div class="tiles">${TILES.map(tile).join("")}</div></section>`;
}
function sky() {
  app.innerHTML = `<section class="wrap"><section class="pagehead"><div class="stars" aria-hidden="true"></div><p class="eyebrow">Небо</p><h1>Карты звёздного неба</h1><p class="lead">Задания на настоящей карте NASA: звёзды, объекты Мессье и линии созвездий.</p></section>
  <div class="tiles two"><a class="tile" href="sky/"><span class="ti">🎲</span><h3>Варианты</h3><p>Один seed — пять заданий. Можно проверять по одному, делиться ссылкой и печатать PDF с QR-кодом.</p><small>21 звезда · 24 объекта Мессье · 3 карты</small><span class="go">Открыть →</span></a>
  <a class="tile" href="sky/exam.html"><span class="ti">📝</span><h3>Экзамен</h3><p>Все задания подряд, оценка в конце — как на настоящей олимпиаде.</p><small>Проверка в конце</small><span class="go">Открыть →</span></a>
  <a class="tile" href="sky/cards.html"><span class="ti">🃏</span><h3>Карточки</h3><p>Все 110 объектов Мессье с фотографиями: каталог, изучение, тренировка по фото.</p><small>110 фотографий</small><span class="go">Открыть →</span></a>
  <a class="tile" href="sky/quiz/quiz.html"><span class="ti">🧠</span><h3>Квиз</h3><p>Вопросы по Мессье (в том числе по фото), именам звёзд, Байеру и картам-искателям. Seed, ссылка, PDF.</p><small>Свои настройки · общий seed</small><span class="go">Открыть →</span></a></div></section>`;
}
function catalog() {
  app.innerHTML = `<section class="wrap"><h1>📚 Каталог</h1><div class="tools panel">
  <input id="q" type="search" placeholder="Поиск: Плутон, Eris…" value="${Q.q}">
  <select id="st"><option value="all">Все объекты</option><option value="official">Официальные</option><option value="candidate">Кандидаты</option></select>
  <select id="rg"><option value="all">Все области</option>${REGIONS.map((r) => `<option>${r}</option>`).join("")}</select>
  <select id="so"><option value="a">Сортировка: по удалённости</option><option value="r">Сортировка: по радиусу</option><option value="name">Сортировка: по алфавиту</option><option value="moons">Сортировка: по спутникам</option></select>
  <button class="btn ghost ${Q.fav ? "on" : ""}" id="fv">⭐ Избранное</button></div><div id="gr"></div></section>`;
  const $ = (s) => app.querySelector(s);
  $("#st").value = Q.status; $("#rg").value = Q.region; $("#so").value = Q.sort;
  const cardHTML = (o) => `<article class="card"><button class="fav ${favs.has(o.id) ? "on" : ""}" data-id="${o.id}" aria-label="В избранное">★</button><a href="#/object/${o.id}">${pic(o)}<h3>${o.name}<small>${o.en}</small></h3></a><span class="tag">${o.region}</span><div class="kv">${data(o)}</div></article>`;
  const draw = () => {
    const f = OBJECTS.filter((o) => (Q.status === "all" || o.status === Q.status) && (Q.region === "all" || o.region === Q.region) && (!Q.fav || favs.has(o.id)) && (o.name + o.en).toLowerCase().includes(Q.q.toLowerCase()));
    const cmp = (x, y) => Q.sort === "name" ? x.name.localeCompare(y.name, "ru") : Q.sort === "moons" ? y.moons.length - x.moons.length : x[Q.sort] - y[Q.sort];
    const groups = [["official", "Официальные карликовые планеты"], ["candidate", "Кандидаты"]];
    $("#gr").innerHTML = groups.map(([s, t]) => { const l = f.filter((o) => o.status === s).sort(cmp); return l.length ? `<h2 class="grp">${t} <span>${l.length}</span></h2><div class="grid">${l.map(cardHTML).join("")}</div>` : ""; }).join("") || `<p class="sub">Ничего не найдено.</p>`;
    app.querySelectorAll(".fav").forEach((b) => b.onclick = () => { const id = b.dataset.id; favs.has(id) ? favs.delete(id) : favs.add(id); saveFavs(); draw(); });
  };
  $("#q").oninput = (e) => { Q.q = e.target.value; draw(); };
  $("#st").onchange = (e) => { Q.status = e.target.value; draw(); };
  $("#rg").onchange = (e) => { Q.region = e.target.value; draw(); };
  $("#so").onchange = (e) => { Q.sort = e.target.value; draw(); };
  $("#fv").onclick = (e) => { Q.fav = !Q.fav; e.currentTarget.classList.toggle("on"); draw(); };
  draw();
}
function object(id) {
  const o = byId(id); if (!o) return (location.hash = "#/catalog");
  app.innerHTML = `<section class="wrap obj"><a class="back" href="#/catalog">← Каталог</a><div class="od">${pic(o)}<div><h1>${o.name} <small>${o.en}</small></h1><span class="tag ${o.status}">${stat(o)}</span> <span class="tag">${o.region}</span>
  <div class="kv big">${data(o)}${o.rot ? row("Вращение", o.rot) : ""}${row("Кольца", o.rings ? "есть" : "нет")}</div>${o.note ? `<p class="note">* ${o.note}</p>` : ""}${o.moons.length ? `<p><b>Спутники:</b> ${o.moons.join(", ")}</p>` : ""}</div></div>
  <h2>Самое интересное</h2><ol class="facts">${o.facts.map((f) => `<li>${f}</li>`).join("")}</ol>
  <p class="note">Иллюстрации — художественные реконструкции. 1 а. е. ≈ 149,6 млн км.</p></section>`;
}
const DW = [["catalog", "Каталог"], ["cards", "Карточки"], ["variant", "Вариант"], ["exam", "Экзамен"]];
function route() {
  const [, p, id] = location.hash.split("/");
  const sec = ["catalog", "object", "cards", "variant", "exam"].includes(p) ? "dwarfs" : p === "sky" ? "sky" : "home";
  document.querySelectorAll("#top a").forEach((a) => a.classList.toggle("on", a.dataset.s === sec));
  document.getElementById("subnav").innerHTML = sec === "dwarfs" ? `<div class="subnav">${DW.map(([k, t]) => `<a href="#/${k}" class="${k === p || (k === "catalog" && p === "object") ? "on" : ""}">${t}</a>`).join("")}</div>` : sec === "sky" ? `<div class="subnav"><a class="on" href="#/sky">Карты</a><a href="sky/cards.html">Карточки</a><a href="sky/quiz/quiz.html">Квиз</a></div>` : "";
  window.scrollTo(0, 0);
  if (p === "catalog") catalog(); else if (p === "object") object(id); else if (p === "cards") mountCards(app); else if (p === "variant" || p === "exam") mountVariant(app, p, id); else if (p === "sky") sky(); else home();
}
addEventListener("hashchange", route); route();

// Общая тема сайта: одна кнопка в верхней панели, один ключ в localStorage на все страницы.
// Новый заход на сайт (новая вкладка/сессия браузера) = чистый прогресс: стираем историю и начатые прохождения.
// Перезагрузка страницы внутри вкладки ничего не стирает. Избранное и тема сохраняются.
(function () {
  try {
    if (!sessionStorage.getItem("rs-visit")) {
      sessionStorage.setItem("rs-visit", "1");
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf("nightweave") === 0 || k.indexOf("nw-strike") === 0 || (k.indexOf("rs-") === 0 && k !== "rs-favs")) localStorage.removeItem(k);
      });
    }
  } catch (e) {}
})();
(function () {
  var KEY = "nw-theme";
  var root = document.documentElement;
  var SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return "dark";
  }
  function paint(theme) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4f1ef" : "#120b07");
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      // показываем, на какую тему переключимся
      btn.innerHTML = theme === "light" ? MOON : SUN;
      var next = theme === "light" ? "тёмную" : "светлую";
      btn.title = "Включить " + next + " тему";
      btn.setAttribute("aria-label", "Включить " + next + " тему");
    }
  }
  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    paint(theme);
  }
  // применяем сразу, до отрисовки, чтобы не мигало
  paint(read());

  var css = document.createElement("style");
  css.textContent =
    ".theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:none;margin-left:10px;padding:0;border:1px solid var(--line);border-radius:99px;background:transparent;color:var(--text);cursor:pointer;transition:background .15s,border-color .15s}" +
    ".theme-toggle:hover{background:var(--line)}" +
    ".theme-toggle:focus-visible{outline:2px solid var(--acc,var(--lime));outline-offset:2px}" +
    ".rs-top nav,body>header>nav{margin-left:auto}" +
    "@media(max-width:640px){.rs-top,body>header{flex-wrap:wrap;row-gap:8px}.rs-top .theme-toggle,body>header .theme-toggle{order:1;margin-left:auto}.rs-top nav,body>header>nav{order:2;flex-basis:100%;margin-left:0;justify-content:flex-start}}";
  document.head.appendChild(css);

  function mount() {
    var bar = document.querySelector(".rs-top") || document.querySelector("body > header");
    if (bar && !document.getElementById("theme-toggle")) {
      var b = document.createElement("button");
      b.type = "button";
      b.id = "theme-toggle";
      b.className = "theme-toggle";
      b.onclick = function () { set(read() === "light" ? "dark" : "light"); };
      bar.appendChild(b);
    }
    paint(read());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
  // синхронизация между открытыми вкладками
  window.addEventListener("storage", function (e) { if (e.key === KEY) paint(read()); });
})();

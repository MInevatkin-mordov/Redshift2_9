// Небо → Карточки: объекты Мессье с фотографиями (каталог, изучение, «По фото», «По названию») + переход в квиз.
import { openCards } from "./card-deck.js?v=2";

const host = document.getElementById("cards");
const pic = (o, blind) => `<div class="oc-pic"><img class="ok" src="./assets/messier/${o.id}.jpg" alt="${blind ? "" : o.name}" loading="lazy" draggable="false" onerror="this.remove()"></div>`;

fetch("./quiz/assets/catalog.json")
  .then((r) => { if (!r.ok) throw new Error("Каталог недоступен"); return r.json(); })
  .then((cat) => {
    const items = cat.messier.map((m) => ({ ...m, key: m.id, name: `${m.id} — ${m.title}` }));
    const types = [...new Set(items.map((i) => i.typeName))];
    const filters = [{ id: "all", title: "Все", test: () => true }, ...types.map((t) => ({ id: t, title: t, test: (i) => i.typeName === t }))];
    const answers = (o) => [o.id, `М${o.number}`, String(o.number), o.title, o.english, o.name, ...(o.aliases || [])];
    const sub = (o) => `${o.typeName} · ${o.mag.toFixed(1)}m${o.detail ? " · " + o.detail : ""}`;
    host.replaceChildren();
    openCards({
      host, items, filters, pic, answers, sub, search: true,
      labels: { grid: "📚 Каталог", ask: "Какой это объект Мессье?", ph: "Номер или название, напр. M31", pick: "Выберите фотографию этого объекта." },
      extra: [{ label: "🧠 Квиз", href: "quiz/quiz.html" }],
    });
  })
  .catch((e) => { host.textContent = "Не удалось загрузить каталог: " + e.message + ". Запустите сайт через start.bat / start.sh."; });

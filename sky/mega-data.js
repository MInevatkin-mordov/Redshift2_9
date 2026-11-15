// Данные режима «Mega Science»: карта мира с обсерваториями.
// Координаты — в пикселях картинки (проекция Меркатора, откалибрована по береговой линии). Область ответа — круг вокруг центра.
// Ла-Силья и Серро-Тололо расположены в ~100 км друг от друга, поэтому их круги на этой карте частично перекрываются.
export const MEGA_WEIGHT = 1;
export const MEGA_IMAGE = { src: "./assets/world-map.jpg", width: 1320, height: 747 };
export const MEGA_ITEMS = [
  { id: "bta", name: "БТА, САО РАН (Архыз)", group: "ru", center: [768.2, 304.5], r: 13 },
  { id: "pulkovo", name: "Пулковская обсерватория", group: "ru", center: [727.6, 208.7], r: 13 },
  { id: "crao", name: "Крымская астрофизическая обсерватория", group: "ru", center: [741.1, 299.1], r: 12 },
  { id: "gaish", name: "ГАИШ МГУ (Москва)", group: "ru", center: [753.9, 236.4], r: 12 },
  { id: "kazan", name: "Казанская обсерватория им. Энгельгардта", group: "ru", center: [795.0, 235.5], r: 12 },
  { id: "kourovka", name: "Коуровская обсерватория (Урал)", group: "ru", center: [834.2, 227.7], r: 13 },
  { id: "sayan", name: "Саянская солнечная обсерватория", group: "ru", center: [985.1, 261.5], r: 14 },
  { id: "ussuri", name: "Уссурийская астрофизическая обсерватория", group: "ru", center: [1099.1, 304.3], r: 14 },
  { id: "keck", name: "Обсерватория Кека", group: "world", center: [49.9, 407.5], r: 14 },
  { id: "lasilla", name: "Ла-Силья", group: "world", center: [359.0, 592.2], r: 9 },
  { id: "tololo", name: "Серро-Тололо", group: "world", center: [358.7, 596.0], r: 9 },
  { id: "paranal", name: "Паранал (VLT)", group: "world", center: [360.2, 573.3], r: 10 },
  { id: "teide", name: "Тейде", group: "world", center: [556.8, 373.8], r: 12 },
  { id: "greenwich", name: "Гринвичская обсерватория", group: "world", center: [617.0, 262.3], r: 11 },
  { id: "effelsberg", name: "Эффельсберг", group: "world", center: [642.1, 267.8], r: 11 },
  { id: "palomar", name: "Паломар", group: "world", center: [190.7, 352.4], r: 12 },
  { id: "lick", name: "Ликская обсерватория", group: "world", center: [173.3, 334.7], r: 11 },
  { id: "yerkes", name: "Йеркская обсерватория", group: "world", center: [294.0, 309.9], r: 13 },
  { id: "arecibo", name: "Арекибо", group: "world", center: [373.5, 413.2], r: 12 },
  { id: "saao", name: "Сазерлендская обсерватория (SAAO)", group: "world", center: [692.9, 605.4], r: 14 },
  { id: "sidingspring", name: "Сайдинг-Спринг", group: "world", center: [1160.7, 600.6], r: 14 },
  { id: "nobeyama", name: "Нобеяма", group: "world", center: [1122.1, 341.0], r: 12 },
  { id: "fast", name: "Радиотелескоп FAST", group: "world", center: [1006.8, 384.6], r: 13 },
].map((o) => ({ ...o, kind: "obs" }));
export const MEGA_MODES = [
  { id: "all", title: "Все обсерватории", note: "Российские и зарубежные" },
  { id: "ru", title: "Россия", note: "Только российские обсерватории" },
  { id: "world", title: "Мир", note: "Зарубежные обсерватории" },
];

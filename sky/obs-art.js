// Иллюстрации обсерваторий для карточек (SVG, рисуются кодом).
// Реальное фото: положите sky/assets/obs/<id>.jpg — оно автоматически заменит рисунок.
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

// Тип рисунка и цветовая гамма для каждой обсерватории.
const KIND = {
  bta: ["bigdome", "#d7dde6"], pulkovo: ["wings", "#e9e1cf"], crao: ["multi2", "#dfe5ec"], gaish: ["tower", "#e4d9c4"],
  kazan: ["dome", "#efe9dc"], kourovka: ["forest", "#dfe5ec"], sayan: ["solar", "#d9dee5"], ussuri: ["dome", "#e5e9ef"],
  keck: ["twin", "#eef1f5"], lasilla: ["multi3", "#e8ebef"], tololo: ["multi2", "#e8ebef"], paranal: ["quad", "#cfd5dc"],
  teide: ["volcano", "#eef1f5"], greenwich: ["clock", "#b9573c"], effelsberg: ["radio", "#e6e9ee"], palomar: ["bigdome", "#f3f4f6"],
  lick: ["multi2", "#e7e2d6"], yerkes: ["wings", "#d8cdb6"], arecibo: ["bowl", "#b8c4b0"], saao: ["multi3", "#eceff3"],
  sidingspring: ["multi2", "#eef0f3"], nobeyama: ["dishes", "#e6e9ee"], fast: ["bowl", "#c4cfc0"],
};

const dome = (cx, by, r, fill, slit = true) => {
  const h = r * 0.62, top = by - h;
  return `<rect x="${cx - r}" y="${top}" width="${2 * r}" height="${h}" fill="${fill}" opacity=".92"/>` +
    `<path d="M${cx - r} ${top}A${r} ${r} 0 0 1 ${cx + r} ${top}Z" fill="${fill}"/>` +
    `<path d="M${cx - r} ${top}A${r} ${r} 0 0 1 ${cx + r} ${top}Z" fill="url(#shade)"/>` +
    (slit ? `<rect x="${cx - r * 0.11}" y="${top - r * 0.97}" width="${r * 0.22}" height="${r * 0.97}" fill="#0b1124"/><rect x="${cx - r * 0.04}" y="${top - r * 0.9}" width="${r * 0.08}" height="${r * 0.6}" fill="#33406b"/>` : "") +
    `<rect x="${cx - r}" y="${by - 3}" width="${2 * r}" height="3" fill="#000" opacity=".25"/>`;
};
const tree = (x, y, s) => `<path d="M${x} ${y - 18 * s}L${x + 7 * s} ${y}L${x - 7 * s} ${y}Z" fill="#0f2a1c"/><path d="M${x} ${y - 28 * s}L${x + 5 * s} ${y - 10 * s}L${x - 5 * s} ${y - 10 * s}Z" fill="#12331f"/>`;
const dish = (cx, cy, rx, ry, rot, fill) =>
  `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shade)"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.12}" ry="${ry * 0.12}" fill="#555"/>` +
  `<path d="M${cx - rx} ${cy}L${cx} ${cy - ry * 2.6}L${cx + rx} ${cy}" fill="none" stroke="#c8cdd4" stroke-width="1.4"/></g>`;

function scene(kind, col, R) {
  const G = 128; // линия земли
  switch (kind) {
    case "dome": return dome(120, G, 34, col);
    case "bigdome": return dome(120, G, 48, col) + `<rect x="60" y="${G - 6}" width="120" height="6" fill="#8b8f98"/>`;
    case "wings": return `<rect x="46" y="${G - 24}" width="148" height="24" fill="${col}" opacity=".9"/><rect x="46" y="${G - 24}" width="148" height="4" fill="#000" opacity=".18"/>` +
      Array.from({ length: 9 }, (_, i) => `<rect x="${54 + i * 16}" y="${G - 18}" width="5" height="9" fill="#27304f"/>`).join("") +
      dome(120, G - 24, 26, col) + dome(62, G - 24, 12, col) + dome(178, G - 24, 12, col);
    case "multi2": return `<path d="M0 ${G}Q70 ${G - 34} 130 ${G - 22}T240 ${G - 10}V160H0Z" fill="#1a1f2e"/>` + dome(90, G - 12, 24, col) + dome(150, G - 4, 18, col);
    case "multi3": return dome(66, G - 2, 22, col) + dome(120, G - 8, 28, col) + dome(174, G - 2, 20, col);
    case "tower": return `<rect x="88" y="${G - 70}" width="64" height="70" fill="${col}"/><rect x="88" y="${G - 70}" width="64" height="5" fill="#000" opacity=".15"/>` +
      Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${96 + c * 15}" y="${G - 60 + r * 20}" width="7" height="11" fill="#27304f"/>`).join("")).join("") + dome(120, G - 70, 20, col) +
      `<rect x="60" y="${G - 22}" width="28" height="22" fill="${col}" opacity=".85"/><rect x="152" y="${G - 22}" width="28" height="22" fill="${col}" opacity=".85"/>`;
    case "forest": return tree(30, G, 1.3) + tree(54, G + 2, 1.1) + tree(190, G, 1.4) + tree(212, G + 2, 1.1) + dome(120, G, 30, col) + tree(160, G + 4, 1);
    case "solar": return `<rect x="104" y="${G - 96}" width="24" height="96" fill="${col}"/><path d="M104 ${G - 96}L128 ${G - 96}L140 ${G - 110}L104 ${G - 104}Z" fill="#aeb5c0"/>` +
      `<path d="M106 ${G - 96}L126 ${G - 96}" stroke="#ffcf6b" stroke-width="3"/><rect x="60" y="${G - 14}" width="120" height="14" fill="${col}" opacity=".85"/><rect x="128" y="${G - 40}" width="14" height="40" fill="${col}" opacity=".7"/>`;
    case "twin": return `<path d="M0 ${G}L70 ${G - 26}L120 ${G - 14}L170 ${G - 34}L240 ${G}V160H0Z" fill="#1c2233"/>` + dome(80, G - 16, 26, col) + dome(160, G - 22, 26, col);
    case "quad": return `<rect x="30" y="${G - 4}" width="180" height="6" fill="#26304a"/>` + [48, 88, 128, 168].map((x, i) => dome(x + 10, G - 4, 17 + (i % 2) * 2, col)).join("");
    case "volcano": return `<path d="M-10 ${G + 6}L100 22L120 38L138 26L250 ${G + 6}Z" fill="#2b2230"/><path d="M100 22L120 38L138 26L128 48L108 44Z" fill="#e8ecf2"/>` + dome(70, G - 8, 18, col) + dome(168, G - 14, 16, col);
    case "clock": return `<path d="M0 ${G}Q60 ${G - 40} 120 ${G - 36}T240 ${G}V160H0Z" fill="#1b2a1f"/>` +
      `<rect x="74" y="${G - 52}" width="92" height="30" fill="${col}"/><rect x="74" y="${G - 52}" width="92" height="4" fill="#000" opacity=".2"/>` +
      Array.from({ length: 6 }, (_, i) => `<rect x="${82 + i * 14}" y="${G - 44}" width="6" height="12" fill="#2a1d1a"/>`).join("") +
      `<rect x="108" y="${G - 76}" width="24" height="26" fill="${col}"/><path d="M104 ${G - 76}L120 ${G - 90}L136 ${G - 76}Z" fill="#6e2f1f"/><rect x="119" y="${G - 112}" width="2" height="24" fill="#ddd"/><circle cx="120" cy="${G - 100}" r="6" fill="#d33b2c"/>`;
    case "radio": return `<rect x="108" y="${G - 52}" width="24" height="52" fill="#9aa1ad"/>` + dish(120, G - 70, 52, 30, -32, col);
    case "dishes": return `<rect x="40" y="${G - 30}" width="10" height="30" fill="#9aa1ad"/>` + dish(45, G - 38, 24, 14, -28, col) + `<rect x="114" y="${G - 40}" width="12" height="40" fill="#9aa1ad"/>` + dish(120, G - 50, 32, 18, -24, col) + `<rect x="190" y="${G - 26}" width="9" height="26" fill="#9aa1ad"/>` + dish(194, G - 34, 20, 12, -34, col);
    case "bowl": return `<path d="M-10 ${G - 30}Q40 ${G - 50} 70 ${G - 24}L170 ${G - 24}Q200 ${G - 52} 250 ${G - 30}V160H-10Z" fill="#1d2a22"/>` +
      `<ellipse cx="120" cy="${G - 20}" rx="82" ry="22" fill="${col}"/><ellipse cx="120" cy="${G - 20}" rx="82" ry="22" fill="url(#shade)"/>` +
      Array.from({ length: 9 }, (_, i) => `<path d="M${120 - 76 + i * 19} ${G - 20 + (i % 2 ? 7 : -7)}Q120 ${G - 8} ${120 + 76 - i * 19} ${G - 20 - (i % 2 ? 7 : -7)}" fill="none" stroke="#6f7c6c" stroke-width=".8" opacity=".7"/>`).join("") +
      `<path d="M50 ${G - 70}L120 ${G - 44}L190 ${G - 70}" fill="none" stroke="#aab" stroke-width="1"/><circle cx="120" cy="${G - 44}" r="4" fill="#ccd"/><rect x="48" y="${G - 78}" width="4" height="30" fill="#889"/><rect x="188" y="${G - 78}" width="4" height="30" fill="#889"/>`;
    default: return dome(120, G, 34, col);
  }
}

export function obsArt(o, blind) {
  const [kind, col] = KIND[o.id] || ["dome", "#e5e9ef"], id = "o" + o.id;
  const R = rnd([...o.id].reduce((x, c) => x + c.charCodeAt(0) * 31, 11));
  let stars = "";
  for (let i = 0; i < 55; i++) stars += `<circle cx="${(R() * 240).toFixed(1)}" cy="${(R() * 100).toFixed(1)}" r="${(R() * 0.9 + 0.2).toFixed(2)}" fill="#fff" opacity="${(R() * 0.7 + 0.25).toFixed(2)}"/>`;
  const warm = o.group === "ru" ? ["#0a1233", "#26204f", "#6b3f55"] : ["#08142e", "#1d2b5a", "#4d4a77"];
  return `<svg viewBox="0 0 240 160" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${blind ? "" : o.name}" class="oc-art"><defs>
<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${warm[0]}"/><stop offset=".65" stop-color="${warm[1]}"/><stop offset="1" stop-color="${warm[2]}"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
<rect width="240" height="160" fill="url(#sky${id})"/>${stars}
<ellipse cx="${60 + (R() * 120) | 0}" cy="30" rx="90" ry="9" fill="#fff" opacity=".05" transform="rotate(-18 120 30)"/>
<rect y="128" width="240" height="32" fill="#10151f"/>${scene(kind, col, R)}<rect y="128" width="240" height="2" fill="#000" opacity=".25"/></svg>`;
}

// Фото из assets/obs/<id>.jpg поверх рисунка; если файла нет — остаётся рисунок.
export const obsPic = (o, blind) =>
  `<div class="oc-pic">${obsArt(o, blind)}<img src="./assets/obs/${o.id}.jpg" alt="${blind ? "" : o.name}" loading="lazy" draggable="false" onload="this.classList.add('ok')" onerror="this.remove()"></div>`;

// Процедурные иллюстрации (SVG). Реальные фото: положите assets/img/<id>.jpg — они заменят рисунок.
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
export function art(o, blind) {
  const A = o.art, id = "g" + o.id, R = rnd([...o.id].reduce((x, c) => x + c.charCodeAt(0) * 31, 7));
  let stars = "";
  for (let i = 0; i < 40; i++) stars += `<circle cx="${(R() * 200).toFixed(1)}" cy="${(R() * 200).toFixed(1)}" r="${(R() * 0.9 + 0.2).toFixed(2)}" fill="#fff" opacity="${(R() * 0.6 + 0.2).toFixed(2)}"/>`;
  const rx = A.ellipse ? 62 : 52, ry = A.ellipse ? 34 : 52;
  const spots = (A.spots || []).map(([x, y, r, c]) => `<circle cx="${100 + x * 100}" cy="${100 + y * 100}" r="${r}" fill="${c || "#fff"}" opacity=".85" clip-path="url(#c${o.id})"/>`).join("");
  const heart = A.heart ? `<path clip-path="url(#c${o.id})" d="M92 112c-16-10-20-24-9-30 6-3 12 0 14 5 3-6 10-9 16-6 10 6 6 20-9 31-4 3-8 2-12 0z" fill="#f6eadb" opacity=".9"/>` : "";
  const ring = o.rings ? `<ellipse cx="100" cy="100" rx="${rx + 24}" ry="${ry * .3 + 8}" fill="none" stroke="#e8d9c8" stroke-opacity=".7" stroke-width="2" transform="rotate(-18 100 100)"/>` : "";
  const moons = o.moons.slice(0, 5).map((_, i) => `<circle cx="${160 + (i % 2) * 12}" cy="${44 + i * 14}" r="${i ? 2.2 : 3.4}" fill="#cfc7bd"/>`).join("");
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${blind ? "" : o.name}" class="art"><defs>
<radialGradient id="${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${A.c[0]}"/><stop offset="1" stop-color="${A.c[1]}"/></radialGradient>
<radialGradient id="s${o.id}" cx=".7" cy=".7" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
<clipPath id="c${o.id}"><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}"/></clipPath></defs>
<rect width="200" height="200" fill="#0b0705"/>${stars}
<g transform="rotate(${A.ellipse ? -20 : 0} 100 100)"><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="url(#${id})"/>${spots}${heart}<ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="url(#s${o.id})"/></g>${ring}${moons}</svg>`;
}
export const pic = (o, blind) => `<div class="pic">${art(o, blind)}<img src="assets/img/${o.id}.jpg" alt="${blind ? "" : o.name}" loading="lazy" onload="this.classList.add('ok')" onerror="this.remove()"></div>`;

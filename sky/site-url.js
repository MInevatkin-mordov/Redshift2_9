import { SITE_URL } from "./site-config.js";

export function currentSiteUrl() {
  return globalThis.location?.href || new URL("./index.html", import.meta.url).href;
}

// QR-коды и ссылки всегда ведут на ваш сайт: SITE_URL из site-config.js, иначе — адрес текущей страницы.
export function siteBaseUrl(current = currentSiteUrl()) {
  const own = String(SITE_URL || "").trim();
  if (/^https?:\/\//i.test(own)) return new URL(own.endsWith("/") ? own : own + "/");
  return new URL("./", current);
}

export function pageUrl(kind, current = currentSiteUrl()) {
  return new URL(kind === "Q" ? "quiz.html" : "./", siteBaseUrl(current));
}

export function localProgressUrl(entry, current = currentSiteUrl()) {
  const result = pageUrl(entry.kind, current);
  if (entry.url) {
    const previous = new URL(entry.url, current);
    result.search = previous.search;
    result.hash = previous.hash;
  }
  return result;
}

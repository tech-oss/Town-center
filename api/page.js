// Every website page (vercel.json sends all addresses here that aren't a
// file): the app's HTML with this page's own title, description, preview,
// canonical, robots instructions and readable text written in, and the right
// status — 404 for a page that doesn't exist, 301 for an old address.
// See api/_lib/seo.js.
//
// It can never take the site down: if the page's details can't be worked
// out (database unreachable, anything unexpected) the app's HTML is sent
// unchanged, exactly as before.

import { resolvePage, renderPage, isIndexableHost } from "./_lib/seo.js";

export const config = { runtime: "edge" };

// The built app (scripts/seo-template.mjs moves index.html to _app.html so
// the home page also comes through here). Kept per instance.
let template = null;
async function appHtml(origin) {
  if (template) return template;
  const res = await fetch(`${origin}/_app.html`);
  if (!res.ok) throw new Error(`App HTML: ${res.status}`);
  template = await res.text();
  return template;
}

const CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  const host = request.headers.get("x-forwarded-host") || url.host;
  const origin = `${request.headers.get("x-forwarded-proto") || "https"}://${host}`;
  const indexable = isIndexableHost(host);

  let html;
  try {
    html = await appHtml(url.origin);
  } catch {
    return new Response("Sorry — the page couldn't load. Please refresh.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "5" } });
  }

  let meta = null;
  try {
    meta = await resolvePage(path, origin);
  } catch (e) {
    console.warn("SEO details unavailable for", path, e?.message ?? e);
  }
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": CACHE,
    ...(indexable ? {} : { "x-robots-tag": "noindex, nofollow" }),
  };
  if (!meta) return new Response(html, { status: 200, headers });

  if (meta.redirect) {
    return new Response(null, { status: meta.status, headers: { location: meta.redirect, "cache-control": CACHE } });
  }
  if (meta.noindex && indexable) headers["x-robots-tag"] = "noindex, nofollow";
  return new Response(renderPage(html, meta, { indexable, origin, url: `${origin}${path}` }), { status: meta.status, headers });
}

// sitemap.xml — every public page, built from the live database each time
// it's asked for (cached for an hour): the main pages, every listed business
// and accommodation property, live and upcoming events, news, offers,
// featured articles and neighbourhood guides, each with when it last
// changed. Expired events and hidden or removed listings drop out by
// themselves.

import { sb, SITE_URL, STATIC_PAGES, businessPath, escapeHtml } from "./_lib/seo.js";

export const config = { runtime: "edge" };

// Every row of a view, a page at a time (the API returns at most 1,000).
async function all(view, query) {
  const rows = [];
  for (let from = 0; from < 20000; from += 1000) {
    const page = await sb(`${view}?${query}&limit=1000&offset=${from}`, { timeoutMs: 8000 });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const day = (d) => (d ? String(d).slice(0, 10) : null);

export default async function handler() {
  const urls = Object.entries(STATIC_PAGES).map(([path, p]) => ({ path, priority: p.priority }));
  const today = new Date().toISOString().slice(0, 10);

  const settled = await Promise.allSettled([
    all("public_business_profiles", "select=business_id,business_type,business_type_detail,updated_at&order=business_id"),
    all("business_events", "status=eq.Live&select=id,slug,updated_at,event_date,is_recurring,recurrence_end_date&order=id"),
    all("public_business_articles", "select=id,date&order=id"),
    all("news_offers", "status=eq.Published&select=slug,updated_at&order=slug"),
    all("feature_articles", "status=eq.Live&select=slug,updated_at&order=slug"),
    all("neighbourhood_guides", "status=eq.Published&select=slug,updated_at&order=slug"),
  ]);
  const [biz, events, articles, news, stories, guides] = settled.map((r) => (r.status === "fulfilled" ? r.value : []));

  for (const b of biz) {
    const path = businessPath(b);
    if (path) urls.push({ path, lastmod: day(b.updated_at), priority: 0.7 });
  }
  for (const e of events) {
    // Past one-off events and finished series are left out.
    const current = e.is_recurring ? !e.recurrence_end_date || e.recurrence_end_date >= today : !e.event_date || e.event_date >= today;
    if (current) urls.push({ path: `/event/${e.slug || e.id}`, lastmod: day(e.updated_at), priority: 0.6 });
  }
  for (const a of articles) urls.push({ path: `/news/live-${a.id}`, lastmod: day(a.date), priority: 0.5 });
  for (const n of news) if (n.slug) urls.push({ path: `/news/${n.slug}`, lastmod: day(n.updated_at), priority: 0.5 });
  for (const s of stories) if (s.slug) urls.push({ path: `/story/${s.slug}`, lastmod: day(s.updated_at), priority: 0.6 });
  for (const g of guides) if (g.slug) urls.push({ path: `/guides/${g.slug}`, lastmod: day(g.updated_at), priority: 0.6 });

  const seen = new Set();
  const body = urls
    .filter((u) => (seen.has(u.path) ? false : seen.add(u.path)))
    .map((u) => `  <url><loc>${escapeHtml(`${SITE_URL}${u.path === "/" ? "/" : u.path}`)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${u.priority ? `<priority>${u.priority.toFixed(1)}</priority>` : ""}</url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}

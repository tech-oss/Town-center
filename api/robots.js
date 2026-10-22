// robots.txt — on the live domain: everything public may be crawled, the
// admin, business portal, app copies and internal addresses may not, and
// here's the sitemap. On any other address (Vercel test addresses): nothing
// may be crawled, so a test copy never competes with the real site.

import { isIndexableHost, SITE_URL } from "./_lib/seo.js";

export const config = { runtime: "edge" };

export default function handler(request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || url.host;
  const body = isIndexableHost(host)
    ? [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /business",
        "Disallow: /mobile",
        "Disallow: /search",
        "Disallow: /api/",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
      ].join("\n")
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=3600" } });
}

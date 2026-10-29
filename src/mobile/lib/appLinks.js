// Where a link from admin (a notification's link) goes in the app.
//
// Admin types website addresses: a path (/story/…), or a full address on the
// site (https://maidenhead.com/eat-drink/place/…, or a test host). Those open
// the matching app screen. Any other website (a business's own site, say)
// opens in the phone's browser.

// Hosts that are this site, so their pages open inside the app.
const SITE_HOSTS = [/(^|\.)maidenhead\.com$/i, /^town-center(-[a-z0-9-]+)?\.vercel\.app$/i, /^localhost$/i];

// Website paths that have the same screen under /mobile.
const SAME_PATH = /^\/(story|news|event|guides|offers|whats-on|explore\/the-future|transport|parking|about|search|work|traders)(\/|$)/;

function appPathFor(pathname, search = "") {
  let m = pathname.match(/^\/(?:eat-drink|shop|see-do|services)\/place\/([^/?#]+)/);
  if (m) return `/mobile/place/${m[1]}`;
  m = pathname.match(/^\/live\/stay\/(hotels|accommodation)\/([^/?#]+)/);
  if (m) return `/mobile/stay/${m[1]}/${m[2]}`;
  m = pathname.match(/^\/(eat-drink|shop|see-do|services|live)\/?$/);
  if (m) return `/mobile/${m[1] === "see-do" ? "see-do" : m[1]}`;
  if (pathname === "/getting-here") return "/mobile/transport";
  if (pathname.startsWith("/mobile")) return pathname + search;
  if (SAME_PATH.test(pathname)) return `/mobile${pathname}${search}`;
  return "/mobile/home";
}

// → { path } for an app screen, { external } for another website, or null.
export function linkTarget(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      if (!SITE_HOSTS.some((h) => h.test(u.hostname))) return { external: u.href };
      return { path: appPathFor(u.pathname, u.search) };
    }
    if (raw.startsWith("/")) {
      const u = new URL(raw, "https://maidenhead.com");
      return { path: appPathFor(u.pathname, u.search) };
    }
    // "www.example.com" typed without https://
    if (/^[\w-]+(\.[\w-]+)+/.test(raw)) return linkTarget(`https://${raw}`);
  } catch { /* not a usable address */ }
  return null;
}

// Opens a link: app screens with the router's navigate, other websites in
// the phone's browser (Safari, outside the app).
export function openLink(target, navigate) {
  if (!target) return;
  if (target.path) navigate(target.path);
  else if (target.external) window.open(target.external, "_blank", "noopener");
}

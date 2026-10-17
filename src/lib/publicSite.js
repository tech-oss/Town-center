// The public Maidenhead site (the admin-panel branch's deployment). Override
// with VITE_PUBLIC_SITE_URL once the site has its production domain.
export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL
  || "https://town-center-git-admin-panel-muhammad-abuzar-s46-projects1.vercel.app").replace(/\/$/, "");

// A site path ("/news/…") as a full link to the public site; a full URL is
// returned as it is.
export function publicSiteLink(path) {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${PUBLIC_SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// A business's (or an accommodation property's) own page on the public site.
// /b/:slug there finds the page under whichever section it's listed; a
// business that isn't publicly listed lands on the home page.
export function publicBusinessUrl(businessId) {
  return `${PUBLIC_SITE_URL}/b/${String(businessId).replace(/^biz_/, "")}`;
}

// What admin can edit on each public page, and what the page falls back to.
//
// One entry per page that actually exists on the site. Each `fields` entry is
// exactly one thing the page renders, so the admin editor is built from this
// list rather than guessing — a field here that no page reads is a field that
// silently does nothing, which is what the old screen was full of.
//
// `defaults` are the words currently written into the components. A page shows
// the saved value when there is one and the default otherwise, so an untouched
// page looks exactly as it does today and clearing a box restores it.
//
// Removed from the old list: Properties (no such page — the /live/for-sale and
// /live/property routes are commented out) and Work (not wanted). Events was
// two pages pretending to be one; it is now What's On.

const text = (name, label, hint) => ({ name, label, hint, type: "text" });
const area = (name, label, hint) => ({ name, label, hint, type: "textarea" });
const image = (name, label, hint) => ({ name, label, hint, type: "image" });

export const SITE_SECTIONS = [
  {
    key: "homepage",
    label: "Homepage",
    page: "/",
    blurb: "The full-screen hero at the top of the homepage, over the background video.",
    fields: [
      text("eyebrow", "Small line above the title", 'Sits above the big word — currently "Welcome to"'),
      text("title", "Big title"),
      text("tagline", "Tagline under the title", "Shown between two rules, in capitals"),
    ],
    defaults: {
      eyebrow: "Welcome to",
      title: "Maidenhead",
      tagline: "Riverside · Connected · Thriving",
    },
  },

  // ── The four section landing pages (CategoryPage) ──
  {
    key: "see-do",
    label: "See & Do",
    page: "/see-do",
    blurb: "The header of the See & Do landing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph", "Shown under the title, and at the top of the app's See & Do screen"),
      image("hero", "Header image (mobile)"),
      image("heroDesktop", "Header image (desktop)", "Optional — the mobile image is used when this is empty"),
    ],
    defaults: {
      title: "See & Do",
      intro: "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
    },
  },
  {
    key: "eat-drink",
    label: "Eat & Drink",
    page: "/eat-drink",
    blurb: "The header of the Eat & Drink landing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph", "Shown under the title, and at the top of the app's Eat & Drink screen"),
      image("hero", "Header image (mobile)"),
      image("heroDesktop", "Header image (desktop)", "Optional — the mobile image is used when this is empty"),
    ],
    defaults: {
      title: "Eat & Drink",
      intro: "From riverside dining to cosy cafés, explore Maidenhead's food and drink scene.",
    },
  },
  {
    key: "shop",
    label: "Shop",
    page: "/shop",
    blurb: "The header of the Shop landing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph", "Shown under the title, and at the top of the app's Shop screen"),
      image("hero", "Header image (mobile)"),
      image("heroDesktop", "Header image (desktop)", "Optional — the mobile image is used when this is empty"),
    ],
    defaults: {
      title: "Shop",
      intro: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
    },
  },
  {
    key: "services",
    label: "Services",
    page: "/services",
    blurb: "The header of the Services landing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph", "Shown under the title, and at the top of the app's Services screen"),
      image("hero", "Header image (mobile)"),
      image("heroDesktop", "Header image (desktop)", "Optional — the mobile image is used when this is empty"),
    ],
    defaults: {
      title: "Services in Maidenhead",
      intro: "Trades, professionals and local businesses serving Maidenhead.",
    },
  },

  // ── Editorial pages ──
  {
    key: "offers",
    label: "Offers & Stories",
    page: "/offers",
    blurb: "The header of the Offers page, where every story and offer is collected.",
    fields: [
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
    ],
    defaults: {
      eyebrow: "Offers & Stories",
      title: "Every Story, In One Place",
      intro: "Discover the complete collection of Featured Stories and Spotlight Articles. Find and search for offers and the latest news from businesses around Maidenhead. Download The Maidenhead App to get all the offers direct to you anytime you need.",
    },
  },
  {
    key: "news",
    label: "News & Articles",
    page: "/news",
    blurb: "The header of the News & Articles page.",
    fields: [
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
    ],
    defaults: {
      eyebrow: "From the Journal",
      title: "In the Spotlight",
      intro: "News, offers and events from Maidenhead's independent businesses — the latest on what's new, what's on and what's worth discovering in town.",
    },
  },
  {
    key: "live-stay",
    label: "Live & Stay",
    page: "/live",
    blurb: "The header of the Live & Stay page.",
    fields: [
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
    ],
    defaults: {
      eyebrow: "Live & Stay",
      title: "Make Maidenhead Home",
      intro: "Discover what makes Maidenhead home — from new developments along the river to hotels and serviced apartments for every visit.",
    },
  },
];

// The Getting Here page keeps its own editor: it is a whole page document
// (transport, parking, tips), not a header, so it does not belong in the
// field-by-field list above.
export const SITE_SECTION_KEYS = SITE_SECTIONS.map((s) => s.key);

export const sectionSpec = (key) => SITE_SECTIONS.find((s) => s.key === key) ?? null;

// What a page should show: the saved value where admin has written one, and
// the component's own wording everywhere else. An empty box means "use the
// default", so clearing a field restores the original rather than blanking
// the page.
export function withDefaults(key, saved) {
  const spec = sectionSpec(key);
  if (!spec) return saved ?? {};
  const out = { ...spec.defaults };
  for (const [k, v] of Object.entries(saved ?? {})) {
    if (typeof v === "string" ? v.trim() !== "" : v != null) out[k] = v;
  }
  return out;
}

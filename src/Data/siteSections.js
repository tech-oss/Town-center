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

import { liveStory } from "./live";

const text = (name, label, hint) => ({ name, label, hint, type: "text" });
const area = (name, label, hint) => ({ name, label, hint, type: "textarea" });
const image = (name, label, hint) => ({ name, label, hint, type: "image" });
const video = (name, label, hint) => ({ name, label, hint, type: "video" });
// A list of paragraphs, each its own box. Stored as an array of strings.
const paras = (name, label, hint) => ({ name, label, hint, type: "paragraphs" });
// A repeating block (a story section, a feature card…). `fields` are the
// block's own fields, any of the types above. Stored as an array of objects.
const blocks = (name, label, itemLabel, fields, hint) => ({ name, label, itemLabel, fields, hint, type: "blocks" });
// A visual divider in the form, to group a long page's fields.
const heading = (label) => ({ name: `__${label}`, label, type: "heading" });

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
      video("heroVideo", "Header video (desktop)", "MP4, ideally under 20MB. Plays muted on a loop."),
      video("heroVideoMobile", "Header video (mobile)", "Optional — portrait cut for phones and the app. The desktop video is used when this is empty."),
      area("intro", "Opening paragraph under the video", "The large paragraph straight under the header video"),
    ],
    defaults: {
      eyebrow: "Welcome to",
      title: "Maidenhead",
      tagline: "Riverside · Connected · Thriving",
      heroVideo: "/videos/hero.mp4",
      heroVideoMobile: "/videos/hero-mobile.mp4",
      intro: "A vibrant riverside destination where historic charm meets contemporary living. Stroll along the Thames, browse independent shops and boutiques, relax in welcoming cafés and artisan coffee shops, enjoy waterside dining, and unwind in stylish bars. Family-friendly attractions and beautiful green spaces to world-renowned Michelin-starred restaurants just minutes away, there's something for every visitor to enjoy.",
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
  // News & Articles (/news) and What's On (/events) were removed: the Offers
  // page and See & Do / the What's On calendar replaced them, and their old
  // routes now redirect there.
  {
    key: "offers",
    label: "Offers & Stories",
    page: "/offers",
    blurb: "The header of the Offers page, where every story and offer is collected — on the website and the app.",
    fields: [
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image"),
    ],
    defaults: {
      eyebrow: "Offers & Stories",
      title: "Every Story, In One Place",
      intro: "Discover the complete collection of Featured Stories and Spotlight Articles. Find and search for offers and the latest news from businesses around Maidenhead. Download The Maidenhead App to get all the offers direct to you anytime you need.",
    },
  },
  {
    key: "live-stay",
    label: "Live & Stay",
    page: "/live",
    blurb: "The whole Live in Maidenhead page, top to bottom.",
    fields: [
      heading("Header"),
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image"),
      heading("Opening"),
      paras("lede", "Opening paragraphs", "The large paragraphs under the header, above the Hotels / Accommodation buttons"),
      heading("Story sections"),
      blocks("sections", "Story sections", "Section", [
        text("eyebrow", "Small line above the heading"),
        text("heading", "Heading"),
        image("image", "Picture"),
        paras("body", "Paragraphs"),
      ], "Picture-and-text sections, alternating sides down the page"),
      heading("Nicholson Quarter"),
      text("nicholsonEyebrow", "Small line above the heading"),
      text("nicholsonHeading", "Heading"),
      image("nicholsonImage", "Picture"),
      paras("nicholsonIntro", "Paragraphs beside the picture"),
      image("nicholsonPlan", "Masterplan picture"),
      paras("nicholsonOutro", "Paragraphs beside the masterplan"),
      heading("Quote band"),
      text("pullLead", "Line above the quote"),
      text("pullQuote", "Quote"),
      image("pullImage", "Background picture"),
      heading("Closing"),
      text("closingHeading", "Heading"),
      paras("closingBody", "Paragraphs"),
      text("closingKicker", "Closing line"),
      text("closingCtaLabel", "Button label"),
      text("closingCtaLink", "Button link", "A page on this site, e.g. /see-do"),
    ],
    defaults: {
      eyebrow: "Live & Stay",
      title: "Live in Maidenhead",
      intro: "A town by the river. Surrounded by green space. Connected to London. And changing for the future.",
      lede: liveStory.lede,
      sections: liveStory.sections.map(({ eyebrow, heading: h, image: img, body }) => ({ eyebrow, heading: h, image: img, body })),
      nicholsonEyebrow: liveStory.nicholson.eyebrow,
      nicholsonHeading: liveStory.nicholson.heading,
      nicholsonImage: liveStory.nicholson.image,
      nicholsonIntro: liveStory.nicholson.intro,
      nicholsonPlan: liveStory.nicholson.planImage,
      nicholsonOutro: liveStory.nicholson.outro,
      pullLead: liveStory.pullQuote.lead,
      pullQuote: liveStory.pullQuote.quote,
      pullImage: liveStory.pullQuote.image,
      closingHeading: liveStory.closing.heading,
      closingBody: liveStory.closing.body,
      closingKicker: liveStory.closing.kicker,
      closingCtaLabel: liveStory.closing.cta.label,
      closingCtaLink: liveStory.closing.cta.to,
    },
  },
  {
    key: "stay-hotels",
    label: "Hotels",
    page: "/live/stay/hotels",
    blurb: "The header of the Hotels listing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image"),
    ],
    defaults: {
      title: "Hotels in Maidenhead",
      intro: "Where to stay in Maidenhead, from the heart of the town centre to riverside retreats along the Thames — with every listing linking directly to the hotel's own website for booking.",
    },
  },
  {
    key: "stay-accommodation",
    label: "Accommodation",
    page: "/live/stay/accommodation",
    blurb: "The header of the Accommodation listing page, on the website and the app.",
    fields: [
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image"),
    ],
    defaults: {
      title: "Accommodation in Maidenhead",
      intro: "Find your ideal stay in and around Maidenhead, from serviced apartments and self-catering cottages to welcoming homes and distinctive places to stay across the area.",
    },
  },
  {
    key: "guides-index",
    label: "Neighbourhood Guides",
    page: "/guides",
    blurb: "The header of the Guides index. The guides themselves are edited under Explore.",
    fields: [
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      // The page renders this as `subtitle`, not `intro`.
      area("subtitle", "Intro paragraph"),
      image("heroImage", "Header image (mobile)"),
      image("heroImageDesktop", "Header image (desktop)"),
    ],
    // This page has always rendered from the database, so its saved row is
    // the only source — there is no wording in the component to fall back to.
    defaults: {},
  },
  {
    key: "about",
    label: "About / Our Story",
    page: "/about",
    blurb: "The whole Our Story page, on the website and the app.",
    fields: [
      heading("Header"),
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image", "Optional — the header is a plain band without one"),
      heading("Main text"),
      paras("body", "Paragraphs", "A paragraph mentioning \"not affiliated\" is shown as the disclaimer, in italics"),
      heading("Get in touch box"),
      text("ctaTitle", "Heading"),
      area("ctaText", "Text"),
      text("ctaButton", "Button label"),
      text("ctaEmail", "Email address the button opens"),      text("ctaExtraLabel", "Extra button label", "Optional — a second button, shown under the first. Leave blank for none"),
      text("ctaExtraUrl", "Extra button link", "A page on this site (e.g. /whats-on) or a full web address (https://…)"),
    ],
    defaults: {
      eyebrow: "About Us",
      title: "Our Story",
      intro: "An independent platform built to celebrate and connect the best of Maidenhead.",
      body: [
        "Maidenhead.com is a privately run, independent platform created to help people discover and connect with everything happening in Maidenhead.",
        "Our goal is simple: to showcase the best of the town — from local businesses and restaurants to events, activities, jobs, and places to live. We aim to make it easier for residents and visitors to find out what's on, what's new, and what's worth exploring.",
        "This website is not affiliated with, endorsed by, or operated by the Royal Borough of Windsor & Maidenhead Council. It is an independent project built, maintained, and updated by a private team with a focus on supporting and promoting the local community.",
        "We believe Maidenhead has a lot to offer, and we want to make that more visible in one simple, easy-to-use place.",
        "If you run a local business, organise events, or want to contribute content, we'd love to hear from you. Our aim is to keep the platform up to date, useful, and genuinely helpful for the town.",
        "Thanks for visiting — and welcome to Maidenhead.",
      ],
      ctaTitle: "Want to get involved?",
      ctaText: "If you run a local business, organise events, or want to contribute content, we'd love to hear from you.",
      ctaButton: "Get in touch",
      ctaEmail: "hello@maidenhead.com",
    },
  },
  {
    key: "traders",
    label: "Our Traders",
    page: "/traders",
    blurb: "The whole Our Traders (Trades & Business Directory) page, on the website and the app.",
    fields: [
      heading("Header"),
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image", "Optional — the header is a plain band without one"),
      heading("Main text"),
      paras("body", "Paragraphs", "A paragraph starting \"While we are proud\" is shown highlighted, in italics"),
      heading("Call to action box"),
      text("ctaTitle", "Heading"),
      area("ctaText", "Text"),
      text("ctaButton", "Button label"),
      text("ctaLink", "Button link", "A page on this site, e.g. /work-with-us"),
    ],
    defaults: {
      eyebrow: "About",
      title: "Our Trades & Business Directory",
      intro: "Our Trades & Business Directory is designed to celebrate and support the fantastic businesses, services, organisations, and events that make our community thrive.",
      body: [
        "This website provides a platform where local businesses and event organisers can showcase their services, share information, and connect with residents and visitors. Our aim is to make it easier for people to discover what is available in the local area while helping businesses raise their profile within the community.",
        "While we are proud to promote local businesses and events, it is important to understand that we act solely as a directory and promotional platform. The businesses, services, products, and events featured on this website are independently owned and operated by their respective providers.",
        "We do not manage, supervise, endorse, or guarantee the quality, availability, suitability, or performance of any business, service, product, or event listed on this site. Any enquiries, bookings, purchases, or agreements are made directly between users and the relevant business or organiser.",
        "We encourage users to carry out their own research and make informed decisions before engaging with any listed business or event.",
        "Thank you for supporting local businesses and helping our community grow.",
      ],
      ctaTitle: "List your business or event",
      ctaText: "Run a local business or organise events? Get in touch to feature on the directory.",
      ctaButton: "Work with us & enquiries",
      ctaLink: "/work-with-us",
    },
  },
  {
    key: "work-with-us",
    label: "Work With Us",
    page: "/work-with-us",
    blurb: "The whole Work With Us & Enquiries page, on the website and the app.",
    fields: [
      heading("Header"),
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      area("intro", "Intro paragraph"),
      image("hero", "Header image", "Optional — the header is a plain band without one"),
      heading("Opening"),
      paras("introParagraphs", "Opening paragraphs"),
      blocks("cards", "Boxes", "Box", [text("title", "Heading"), area("body", "Text")], "Shown side by side under the opening paragraphs"),
      heading("For businesses"),
      text("visibilityHeading", "Heading"),
      paras("visibilityParagraphs", "Paragraphs"),
      heading("Get in touch box"),
      text("ctaTitle", "Heading"),
      area("ctaText", "Text"),
      text("ctaEmail", "Email address"),      text("ctaExtraLabel", "Extra button label", "Optional — a second button, shown under the first. Leave blank for none"),
      text("ctaExtraUrl", "Extra button link", "A page on this site (e.g. /whats-on) or a full web address (https://…)"),
    ],
    defaults: {
      eyebrow: "Get Involved",
      title: "Work With Us & Enquiries",
      intro: "Working on a story about Maidenhead? We're here to help.",
      introParagraphs: [
        "Maidenhead.com is an independent platform celebrating everything happening across Maidenhead town centre — from local businesses, restaurants and shops to events, activities and the town's ongoing regeneration.",
        "We welcome enquiries from journalists, bloggers, content creators and local media. Whether you're writing about Maidenhead's independent businesses, the Nicholson Quarter regeneration, or the town's growing food, retail and events scene, we're happy to help with information, interviews and introductions.",
      ],
      cards: [
        { title: "Media Enquiries", body: "For interviews, quotes, data or comment about Maidenhead town centre and the businesses featured on the platform, get in touch and we'll respond as quickly as we can." },
        { title: "Partnerships", body: "We collaborate with local organisations, event organisers and businesses to promote the best of Maidenhead. If you'd like to work with us, we'd love to hear your ideas." },
      ],
      visibilityHeading: "For businesses to grow your presence and visibility",
      visibilityParagraphs: [
        "This platform with its web and app, helps connect local businesses, organisations, community groups and stakeholders with people who live, work and visit the area.",
        "By creating a profile, you can showcase your services, opening hours, contact details, events and key information in one easy-to-find place. This gives residents and visitors a simple way to discover what you offer and stay connected with what's happening locally.",
        "For organisations looking for greater visibility, enhanced profile options are available. These can include featured listings, business spotlights, news updates, special offers, featured articles and other promotional opportunities designed to help you reach a wider audience.",
        "Businesses can also benefit from in-app notifications, allowing important updates, events, offers and announcements to be delivered directly to users who are interested in local information and activities.",
        "Our aim is to provide a useful platform that helps strengthen connections between local businesses, community organisations and the people they serve.",
        "If you would like to learn more about creating a profile or the additional visibility options available, please contact us for further details.",
      ],
      ctaTitle: "Get in touch",
      ctaText: "Email us with your enquiry and a few details, and we'll get back to you.",
      ctaEmail: "press@maidenhead.com",
    },
  },
  {
    key: "get-the-app",
    label: "Get the App",
    page: "/get-the-app",
    blurb: "The whole Get the App page.",
    fields: [
      heading("Header"),
      text("eyebrow", "Small line above the title"),
      text("title", "Page title"),
      paras("intro", "Paragraphs under the title"),
      image("hero", "Picture beside the text"),
      heading("Features"),
      text("featuresHeading", "Heading"),
      blocks("features", "Feature boxes", "Feature", [text("title", "Heading"), area("text", "Text")]),
      heading("Download box"),
      text("ctaTitle", "Heading"),
      area("ctaText", "Text"),
    ],
    defaults: {
      eyebrow: "The Maidenhead App",
      title: "Get the Maidenhead App",
      intro: [
        "Make the most of everything the town has to offer, all from one convenient place.",
        "Designed to help you stay connected and informed, the Maidenhead App brings together local deals, special promotions, community events, and the latest town updates in a simple, easy-to-use platform. Whether you're looking for places to visit, ways to support local businesses, a new home or what's happening around town, the app helps you discover more of Maidenhead every day.",
      ],
      featuresHeading: "Everything Maidenhead, in your pocket",
      features: [
        { title: "Local deals & offers", text: "Exclusive promotions from independent shops, cafés and restaurants across town." },
        { title: "What's on", text: "Community events, markets and festivals — never miss what's happening in Maidenhead." },
        { title: "Discover & support local", text: "Find places to visit and easy ways to back the businesses that make the town special." },
        { title: "Town updates", text: "The latest news, openings and updates from around the town centre, all in one feed." },
      ],
      ctaTitle: "Download today",
      ctaText: "Free to download on iOS and Android.",
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
    // A list left empty falls back too — clearing every paragraph restores
    // the page's own, rather than leaving a hole in it.
    if (Array.isArray(v)) { if (v.length) out[k] = v; continue; }
    if (typeof v === "string" ? v.trim() !== "" : v != null) out[k] = v;
  }
  return out;
}

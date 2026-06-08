// ════════════════════════════════════════════════════════════════════════════
//  "Work" section — Maidenhead's local economic ecosystem.
//  A hyper-local, community-focused hub combining: Jobs · Freelance ·
//  Business Directory · Business Opportunities · Services Marketplace ·
//  Training & Learning · Networking & Events.
//
//  Route: /work → WorkPage  (category sub-pages: /work/:category)
// ════════════════════════════════════════════════════════════════════════════

export const work = {
  hero: {
    eyebrow: "Work in Maidenhead",
    title: "Work. Connect. Grow in Maidenhead",
    intro: "Find jobs, freelance projects, local services, business opportunities and more — all in one place.",
    image: "/images/slide-river.jpg",
  },

  // Location options for the hero search
  locations: ["Maidenhead", "Cookham", "Bray", "Taplow", "Furze Platt", "Royal Borough"],

  // The seven pillars of the Work ecosystem
  categories: [
    { id: "jobs", icon: "briefcase", title: "Jobs", desc: "Find full-time, part-time and contract jobs" },
    { id: "freelance", icon: "tools", title: "Freelance", desc: "Find and apply for local projects" },
    { id: "directory", icon: "building", title: "Business Directory", desc: "Discover local businesses and services" },
    { id: "opportunities", icon: "handshake", title: "Business Opportunities", desc: "Partnerships, investments & more" },
    { id: "services", icon: "services", title: "Services Marketplace", desc: "Find local services & professionals" },
    { id: "training", icon: "cap", title: "Training & Learning", desc: "Courses, workshops & skill development" },
    { id: "networking", icon: "people", title: "Networking & Events", desc: "Meetups, events & business networking" },
  ],

  // Featured opportunities (mixed types). meta items: { icon, label }
  featured: [
    {
      tag: "Job",
      type: "job",
      title: "Marketing Assistant",
      to: "/work/jobs",
      meta: [
        { icon: "badge", label: "Full-time" },
        { icon: "pin", label: "Maidenhead" },
        { icon: "pound", label: "£22,000 – £28,000" },
        { icon: "clock", label: "2 days ago" },
      ],
    },
    {
      tag: "Freelance",
      type: "freelance",
      title: "Logo Design for Café",
      to: "/work/freelance",
      meta: [
        { icon: "tag", label: "Fixed Price" },
        { icon: "pound", label: "£150 – £300" },
        { icon: "clock", label: "1 day ago" },
      ],
    },
    {
      tag: "Service",
      type: "service",
      title: "Website Development",
      to: "/work/services",
      meta: [
        { icon: "tag", label: "Fixed Price" },
        { icon: "pound", label: "£500 – £1,200" },
        { icon: "clock", label: "3 days ago" },
      ],
    },
    {
      tag: "Training",
      type: "training",
      title: "Digital Marketing Workshop",
      to: "/work/training",
      meta: [
        { icon: "award", label: "Certificate" },
        { icon: "calendar", label: "20 Jun 2026" },
        { icon: "pin", label: "Maidenhead" },
      ],
    },
  ],
};

// Tag colours for featured cards
export const tagColors = {
  job: { bg: "#E0E7FF", text: "#4338CA" },        // indigo
  freelance: { bg: "#EDE9FE", text: "#6D28D9" },  // purple
  service: { bg: "#FFEDD5", text: "#C2410C" },    // amber
  training: { bg: "#DCFCE7", text: "#15803D" },   // green
};

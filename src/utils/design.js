// ─── Shared design tokens ────────────────────────────────────────────────────
// Single source of truth for the visual system.
// Import these in components so every card, badge, and button stays in sync.

export const card = {
  shadow: "0 8px 24px rgba(13,42,51,0.08)",
  shadowHover: "0 16px 40px rgba(13,42,51,0.14)",
  radius: "14px",
};

// Category / offer / tag pills
export const pill = {
  className: "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full whitespace-nowrap",
};

// Two button variants — both pill-shaped
export const btn = {
  primary: {
    className: "inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px",
    style: { backgroundColor: "var(--forest)" },
  },
  outline: {
    className: "inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-80",
    style: { border: "1.5px solid var(--forest)", color: "var(--forest)" },
  },
  // Text link variant — underlined with trailing arrow
  text: {
    className: "group inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 decoration-1 transition-opacity duration-150 hover:opacity-70",
  },
};

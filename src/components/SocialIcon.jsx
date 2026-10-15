// Brand marks for a business's social links, drawn in currentColor so the
// link sets the colour. Used where a row of social buttons shows icons
// rather than names (an accommodation property's Managed By section, on the
// website and in the app). Network names: lib/socialNames.js.

export default function SocialIcon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true };
  switch (name) {
    case "instagram":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return <svg {...p} fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5z" /></svg>;
    case "x":
    case "twitter":
      return <svg {...p} fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.3-5.6L6.3 21H3.3l7-8L2.6 3h6.1l3.9 5.1L17.5 3zm-2.1 16h1.6L8.7 4.7H7L15.4 19z" /></svg>;
    case "tiktok":
      return <svg {...p} fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z" /></svg>;
    case "linkedin":
      return <svg {...p} fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z" /></svg>;
    case "youtube":
      return <svg {...p} fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></svg>;
    default:
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
  }
}

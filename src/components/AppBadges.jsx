// Reusable App Store / Google Play download badges.
// Links point to "#app" until the live store URLs are available — swap in the
// real App Store / Play Store links when the app ships.

const APP_STORE_URL = "#app";
const PLAY_STORE_URL = "#app";

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.13 3.02-.79.9-2.07 1.6-3.16 1.51-.13-1.13.43-2.32 1.1-3.06.77-.84 2.13-1.46 3.19-1.47zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-1 1.56-2.4 3.5-4.14 3.51-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1.01-1.74-.02-3.07-1.77-4.07-3.33-2.79-4.37-3.08-9.5-1.36-12.23 1.22-1.94 3.15-3.07 4.96-3.07 1.85 0 3.01 1.01 4.54 1.01 1.48 0 2.38-1.01 4.53-1.01 1.62 0 3.34.88 4.56 2.4-4.01 2.2-3.36 7.92.65 9.75z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13 12.1v-.2L3.7 2.2l-.1.1z" fill="#00D2FF" />
      <path d="M16.3 15.4 13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2h-.1z" fill="#FFCE00" />
      <path d="M16.4 15.3 13 12 3.6 21.7c.4.4 1 .4 1.7.1l11.1-6.5z" fill="#ED3241" />
      <path d="M16.4 8.7 5.3 2.2c-.7-.4-1.3-.3-1.7.1L13 12l3.4-3.3z" fill="#00DF5E" />
    </svg>
  );
}

function Badge({ href, icon, top, bottom }) {
  return (
    <a
      href={href}
      aria-label={`${top} ${bottom}`}
      className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: "#000", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex flex-col leading-none text-left">
        <span className="text-[10px] tracking-wide" style={{ opacity: 0.85 }}>{top}</span>
        <span className="text-base font-semibold tracking-tight">{bottom}</span>
      </span>
    </a>
  );
}

export default function AppBadges({ className = "" }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Badge href={APP_STORE_URL} icon={<AppleIcon />} top="Download on the" bottom="App Store" />
      <Badge href={PLAY_STORE_URL} icon={<GooglePlayIcon />} top="GET IT ON" bottom="Google Play" />
    </div>
  );
}

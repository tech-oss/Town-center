import { Link } from "react-router-dom";
import { externalUrl } from "../lib/externalUrl";

// The "how to get there" block under a place in a Neighbourhood Guide: the
// address (with directions), the phone number (tap to call) and a link to the
// place's website or its page on this site. Every part is optional — admin
// fills in whichever apply, and anything left blank simply doesn't show.
//
// Shared by the website and the app so the two can't drift apart. `mobile`
// only changes sizing and turns an internal business link into its app route.

// A business page on the website ("/eat-drink/place/solas") has an app
// equivalent ("/mobile/place/solas"). Anything else internal is left as the
// website path, which the app can still open.
function appPath(path) {
  const m = path.match(/^\/[^/]+\/place\/([^/?#]+)/);
  return m ? `/mobile/place/${m[1]}` : path;
}

// "Visit Solas" / "Visit website" when admin didn't give the button a label.
function defaultLabel(url, title) {
  if (url.startsWith("/")) return title ? `View ${title}` : "More details";
  return "Visit website";
}

const Pin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
    <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
  </svg>
);
const Phone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

export default function GuidePlaceContact({ place, mobile = false }) {
  const address = place.address?.trim();
  const phone = place.phone?.trim();
  const rawUrl = place.url?.trim();
  if (!address && !phone && !rawUrl) return null;

  const directions = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : null;
  // Spaces and brackets are fine to show but not in a tel: link. A UK number
  // written "+44 (0)1628…" keeps its 0 only for dialling from inside the UK;
  // after +44 it must go, or the call doesn't connect.
  const tel = phone ? `tel:${phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "")}` : null;

  const internal = rawUrl?.startsWith("/");
  const href = rawUrl ? (internal ? (mobile ? appPath(rawUrl) : rawUrl) : externalUrl(rawUrl)) : null;
  const label = place.linkLabel?.trim() || (rawUrl ? defaultLabel(rawUrl, place.title) : "");

  const text = mobile ? "text-[15px]" : "text-base md:text-lg";
  const row = "flex items-start gap-2.5";
  const linkStyle = { color: "var(--teal-deep)" };

  return (
    <div className={`flex flex-col ${mobile ? "gap-3 mt-1" : "gap-3.5 mt-5"}`}>
      {address && (
        <div className={row} style={{ color: "#000000" }}>
          <Pin />
          <div className="flex flex-col gap-1 min-w-0">
            <span className={`${text} font-semibold leading-snug`}>{address}</span>
            <a href={directions} target="_blank" rel="noopener noreferrer" data-skip-external-confirm
              className="text-sm font-bold underline underline-offset-2 hover:opacity-75 active:opacity-70 w-fit" style={linkStyle}>
              Get directions
            </a>
          </div>
        </div>
      )}

      {phone && (
        <a href={tel} className={`${row} items-center ${text} font-semibold hover:opacity-75 active:opacity-70 w-fit`} style={linkStyle}>
          <Phone />
          {phone}
        </a>
      )}

      {href && (
        internal ? (
          <Link to={href}
            className={`inline-flex items-center justify-center gap-2 self-start rounded-full font-bold transition-opacity hover:opacity-90 active:opacity-80 ${mobile ? "px-5 py-3 text-sm" : "px-6 py-3 text-base"}`}
            style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}>
            {label} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 self-start rounded-full font-bold transition-opacity hover:opacity-90 active:opacity-80 ${mobile ? "px-5 py-3 text-sm" : "px-6 py-3 text-base"}`}
            style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}>
            {label} <span aria-hidden="true">↗</span>
          </a>
        )
      )}
    </div>
  );
}

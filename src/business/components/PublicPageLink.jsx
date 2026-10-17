import { useEffect, useRef, useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { isAccommodationCompany } from "../../Data/accommodation";
import { listProperties } from "../api/accommodation";
import { publicBusinessUrl } from "../../lib/publicSite";

// "View my public page": opens the business's own page on the public site.
//
// An accommodation management company has no page of its own — its
// properties do. With one live property the link opens it; with several it
// opens a short list to pick from; with none it says so. (It used to send the
// company to the site's home page.)
//
// `className` / `style` style the trigger; `menuClassName` positions the list
// (it opens above the sidebar link, below the dashboard button).
export default function PublicPageLink({ label = "View my public page", className = "", style, menuClassName = "top-full mt-2 left-0" }) {
  const { user } = useBusinessAuth();
  const company = isAccommodationCompany(user);
  const [live, setLive] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!company || !user?.id) return undefined;
    let cancelled = false;
    listProperties(user.id)
      .then((list) => { if (!cancelled) setLive(list.filter((p) => p.state === "live")); })
      .catch(() => { if (!cancelled) setLive([]); });
    return () => { cancelled = true; };
  }, [company, user?.id]);

  // Close the list on an outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!user?.id) return null;
  const linkProps = { target: "_blank", rel: "noopener noreferrer", "data-skip-external-confirm": true };

  if (!company) {
    return <a href={publicBusinessUrl(user.id)} {...linkProps} className={className} style={style}>{label}</a>;
  }
  if (live === null) {
    return <span className={className} style={{ ...style, opacity: 0.5 }}>{label}</span>;
  }
  if (live.length === 0) {
    return (
      <span className={className} style={{ ...style, opacity: 0.5, cursor: "not-allowed" }}
        title="None of your properties is live on the site yet.">
        {label}
      </span>
    );
  }
  if (live.length === 1) {
    return <a href={publicBusinessUrl(live[0].id)} {...linkProps} className={className} style={style}>{label}</a>;
  }
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`text-left ${className}`} style={style}>
        {label}
      </button>
      {open && (
        <div className={`absolute z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ${menuClassName}`}
          style={{ border: "1px solid rgba(16,24,40,0.1)" }}>
          <p className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#6B7280" }}>Your live properties</p>
          {live.map((p) => (
            <a key={p.id} href={publicBusinessUrl(p.id)} {...linkProps} onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-sm hover:bg-black/5" style={{ color: "#101828" }}>
              <span className="block font-semibold truncate">{p.name}</span>
              {p.address && <span className="block text-xs truncate" style={{ color: "#6B7280" }}>{p.address}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

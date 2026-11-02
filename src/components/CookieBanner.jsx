// The cookie notice: shown on a first visit to the website or mobile site
// until the visitor chooses, and again from any "Cookie Settings" link.
// Accept and Reject are equally prominent, as the ICO expects. Not shown on
// its own in the App Store app, which stores nothing optional unless the
// visitor turns it on from Cookie Settings.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { getConsent, onOpenCookieSettings, saveConsent } from "../lib/cookieConsent";

const INK = "#1C2E38";
const TEAL = "#1F9BB5";

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-60"
      style={{ backgroundColor: checked ? TEAL : "rgba(28,46,56,0.25)" }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "none" }} />
    </button>
  );
}

function Group({ title, text, checked, onChange, locked }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderTop: "1px solid rgba(28,46,56,0.1)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: INK }}>{title}</p>
        <p className="text-xs leading-snug mt-0.5" style={{ color: "rgba(28,46,56,0.7)" }}>{text}</p>
      </div>
      {locked
        ? <span className="text-xs font-semibold shrink-0 pt-0.5" style={{ color: "rgba(28,46,56,0.55)" }}>Always on</span>
        : <Toggle checked={checked} onChange={onChange} label={title} />}
    </div>
  );
}

export default function CookieBanner({ policyPath = "/cookies" }) {
  const [open, setOpen] = useState(() => !Capacitor.isNativePlatform() && !getConsent());
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(() => !!getConsent()?.analytics);
  const [functional, setFunctional] = useState(() => !!getConsent()?.functional);

  useEffect(() => onOpenCookieSettings(() => {
    const c = getConsent();
    setAnalytics(!!c?.analytics);
    setFunctional(!!c?.functional);
    setManage(true);
    setOpen(true);
  }), []);

  if (!open) return null;

  function choose(choice) {
    saveConsent(choice);
    setOpen(false);
    setManage(false);
  }

  const btn = "flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85";
  return (
    <div className="fixed inset-x-0 bottom-0 z-[6000] flex justify-center p-3 sm:p-5 pointer-events-none"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <div role="dialog" aria-modal="false" aria-labelledby="cookie-title"
        className="pointer-events-auto w-full max-w-[560px] bg-white rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "0 18px 50px -12px rgba(0,0,0,0.45)", border: "1px solid rgba(28,46,56,0.1)" }}>
        <p id="cookie-title" className="text-base font-bold" style={{ color: INK }}>
          {manage ? "Cookie settings" : "We use cookies"}
        </p>
        <p className="text-[13px] leading-snug mt-1.5" style={{ color: "rgba(28,46,56,0.8)" }}>
          Some cookies are essential to make Maidenhead.com work. With your permission we'd also like to use
          optional ones for anonymous visitor statistics, and for features from other providers such as our
          chat assistant and interactive maps.{" "}
          <Link to={policyPath} onClick={() => setOpen(false)} className="font-semibold underline" style={{ color: TEAL }}>Cookie Policy</Link>
        </p>

        {manage && (
          <div className="mt-3">
            <Group title="Essential" locked
              text="Keep you signed in, remember your choices and settings, and keep the site secure." />
            <Group title="Analytics" checked={analytics} onChange={setAnalytics}
              text="An anonymous visitor ID stored on your device, used with page-view counts that help us and local businesses see how pages are doing." />
            <Group title="Features from other providers" checked={functional} onChange={setFunctional}
              text="Our chat assistant (Elfsight) and interactive maps (OpenStreetMap). These providers may set their own cookies." />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {manage ? (
            <>
              <button type="button" className={btn} style={{ backgroundColor: INK, color: "#fff" }}
                onClick={() => choose({ analytics, functional })}>Save choices</button>
              <button type="button" className={btn} style={{ backgroundColor: "rgba(28,46,56,0.08)", color: INK }}
                onClick={() => choose({ analytics: true, functional: true })}>Accept all</button>
            </>
          ) : (
            <>
              <button type="button" className={btn} style={{ backgroundColor: INK, color: "#fff" }}
                onClick={() => choose({ analytics: true, functional: true })}>Accept all</button>
              <button type="button" className={btn} style={{ backgroundColor: INK, color: "#fff" }}
                onClick={() => choose({ analytics: false, functional: false })}>Reject optional</button>
              <button type="button" className={`${btn} basis-full sm:basis-auto`} style={{ backgroundColor: "rgba(28,46,56,0.08)", color: INK }}
                onClick={() => setManage(true)}>Manage settings</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

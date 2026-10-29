// The App Store app's first-launch window: explains the two permissions the
// app uses (location for the map, notifications for news and offers) and
// lets the visitor turn each on, which brings up iOS's own permission
// prompt. Shown once per install; "Continue" always closes it, whatever was
// chosen — Apple requires the app to work without either permission.
import { useState } from "react";
import { subscribeToPush } from "../lib/pushSubscribe";
import { markPermissionsWelcomeSeen } from "../lib/permissionsWelcome";

function askLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      () => resolve("on"),
      (err) => resolve(err?.code === 1 ? "off" : "on"), // 1 = refused; a timeout still means allowed
      { timeout: 15000, maximumAge: 600000 },
    );
  });
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function Row({ icon, title, text, status, onEnable }) {
  const label = { on: "On", off: "Off", busy: "…", unavailable: "Not available" }[status];
  return (
    <div className="flex items-start gap-3 py-4" style={{ borderTop: "1px solid rgba(28,46,56,0.08)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(31,155,181,0.1)", color: "var(--teal-deep, #1F9BB5)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold" style={{ color: "#1C2E38" }}>{title}</p>
        <p className="text-[13px] leading-snug mt-0.5" style={{ color: "rgba(28,46,56,0.65)" }}>{text}</p>
      </div>
      {status === "idle" ? (
        <button type="button" onClick={onEnable}
          className="shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold text-white active:opacity-80"
          style={{ backgroundColor: "var(--teal-deep, #1F9BB5)" }}>
          Turn on
        </button>
      ) : (
        <span className="shrink-0 px-3 py-2 text-[13px] font-semibold"
          style={{ color: status === "on" ? "#047857" : "rgba(28,46,56,0.5)" }}>
          {status === "on" ? "✓ On" : label}
        </span>
      )}
    </div>
  );
}

export default function PermissionsWelcome({ onClose }) {
  const [location, setLocation] = useState("idle");
  const [push, setPush] = useState("idle");
  const [note, setNote] = useState("");

  async function enableLocation() {
    setLocation("busy");
    setLocation(await askLocation());
  }

  async function enablePush() {
    setPush("busy");
    const res = await subscribeToPush();
    setPush(res.ok ? "on" : "off");
    if (!res.ok) setNote(res.error);
  }

  function close() {
    markPermissionsWelcomeSeen();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[5000] flex items-end justify-center"
      style={{ backgroundColor: "rgba(10,20,26,0.55)" }} role="dialog" aria-modal="true" aria-labelledby="perm-title">
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl px-6 pt-7"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))", boxShadow: "0 -12px 40px rgba(0,0,0,0.25)" }}>
        <img src="/logo-mark.svg" alt="" className="w-12 h-auto mb-3" />
        <h2 id="perm-title" className="text-[22px] font-bold leading-tight" style={{ color: "#1C2E38" }}>Welcome to Maidenhead</h2>
        <p className="text-[14px] leading-snug mt-1.5 mb-4" style={{ color: "rgba(28,46,56,0.7)" }}>
          Get the most out of the app by turning these on. You can change them any time in your iPhone's Settings.
        </p>

        <Row icon={<PinIcon />} title="Location"
          text="Shows where you are on the town map and what's nearby. Only used while the app is open."
          status={location} onEnable={enableLocation} />
        <Row icon={<BellIcon />} title="Notifications"
          text="News, events and offers from around town."
          status={push} onEnable={enablePush} />

        {note && <p className="text-[12px] mt-1 mb-2" style={{ color: "rgba(28,46,56,0.6)" }}>{note}</p>}

        <button type="button" onClick={close}
          className="w-full mt-3 py-3.5 rounded-2xl text-[15px] font-semibold text-white active:opacity-85"
          style={{ backgroundColor: "#1C2E38" }}>
          Continue
        </button>
      </div>
    </div>
  );
}

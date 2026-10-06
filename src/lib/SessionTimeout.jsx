import { useEffect, useRef, useState } from "react";

// Signs a portal user out after a stretch of inactivity.
//
// After IDLE_MINUTES with no mouse, keyboard, scroll or touch, a "session
// timeout" prompt appears with a countdown. "Stay signed in" carries on; if
// nobody answers within WARN_SECONDS, `onTimeout` signs them out.
//
// Time is judged from real clock timestamps kept in localStorage, not from a
// timer that counts ticks, so:
//   • a laptop that slept past the deadline signs out the moment it wakes;
//   • activity in one browser tab keeps every other tab of the portal alive;
//   • answering the prompt in one tab dismisses it in the others.
//
// Kept identical in the admin panel and the business portal.

const IDLE_MINUTES = 15;
const WARN_SECONDS = 60;
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "wheel", "touchstart", "click"];

export default function SessionTimeout({ portal, onTimeout }) {
  const key = `session-activity:${portal}`;
  const [secondsLeft, setSecondsLeft] = useState(null); // null = not warning
  const warning = secondsLeft !== null;
  const warningRef = useRef(false);
  warningRef.current = warning;
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;
  const firedRef = useRef(false);

  const read = () => { try { return Number(localStorage.getItem(key)) || Date.now(); } catch { return Date.now(); } };
  const touch = () => { try { localStorage.setItem(key, String(Date.now())); } catch { /* storage unavailable */ } };

  useEffect(() => {
    // Starting up counts as activity only if the last recorded activity is
    // long gone (a fresh sign-in after a past session). A re-mount mid-session
    // — the layout rebuilding itself — must not quietly restart the 15 minutes.
    let stored = null;
    try { stored = Number(localStorage.getItem(key)) || null; } catch { /* storage unavailable */ }
    if (!stored || Date.now() - stored > (IDLE_MINUTES * 60 + WARN_SECONDS + 60) * 1000) touch();
    let lastWrite = Date.now();
    // While the prompt is up, only its button counts as a reply: moving the
    // mouse must not dismiss it.
    //
    // A mouse that has not moved does not count. Chrome re-sends a "mousemove"
    // with the same coordinates whenever the page under a still cursor changes
    // (the sidebar badges refresh every minute, for one), and each of those
    // was restarting the 15 minutes — so nobody was ever signed out.
    let lastX = null, lastY = null;
    function onActivity(e) {
      if (warningRef.current) return;
      if (e?.type === "mousemove") {
        const moved = lastX === null || Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) >= 3;
        lastX = e.clientX; lastY = e.clientY;
        if (!moved) return;
      }
      const now = Date.now();
      if (now - lastWrite > 1000) { lastWrite = now; touch(); }
    }
    for (const e of EVENTS) window.addEventListener(e, onActivity, { passive: true });

    const tick = setInterval(() => {
      if (firedRef.current) return;
      const idleMs = Date.now() - read();
      const limit = IDLE_MINUTES * 60 * 1000;
      if (idleMs >= limit + WARN_SECONDS * 1000) {
        firedRef.current = true;
        timeoutRef.current?.();
      } else if (idleMs >= limit) {
        setSecondsLeft(Math.max(0, Math.ceil((limit + WARN_SECONDS * 1000 - idleMs) / 1000)));
      } else {
        setSecondsLeft(null);
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      for (const e of EVENTS) window.removeEventListener(e, onActivity);
    };
  }, [key]);

  if (!warning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(15,23,42,0.6)" }}
      role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-3" style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.35)" }}>
        <h2 id="session-timeout-title" className="text-lg font-bold" style={{ color: "#1E293B" }}>Session timeout</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
          You've been inactive for a while. For your security you'll be signed out in{" "}
          <strong style={{ color: "#B91C1C" }}>{secondsLeft} second{secondsLeft === 1 ? "" : "s"}</strong>.
        </p>
        <div className="flex gap-3 mt-2">
          <button type="button" autoFocus onClick={() => { touch(); setSecondsLeft(null); }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2563EB" }}>
            Stay signed in
          </button>
          <button type="button" onClick={() => { firedRef.current = true; timeoutRef.current?.(); }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ border: "1.5px solid rgba(16,24,40,0.15)", color: "#1E293B" }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

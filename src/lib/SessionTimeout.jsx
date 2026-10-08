import { useEffect, useRef, useState } from "react";

// Signs a portal user out after a stretch of inactivity.
//
// After IDLE_MINUTES with no mouse, keyboard, scroll or touch, a "session
// timeout" prompt appears and counts down WARN_SECONDS from the moment it is
// shown. "Stay signed in" carries on; if nobody answers in time, `onTimeout`
// signs them out. The question is always asked first — even if the page only
// notices after a long sleep — except past MAX_IDLE_MINUTES (an abandoned
// computer), where there is nobody to ask and the session just ends.
//
// Time is judged from real clock timestamps kept in localStorage, not from a
// timer that counts ticks, so:
//   • a laptop that slept is checked the moment it wakes, before any touch;
//   • activity in one browser tab keeps every other tab of the portal alive;
//   • answering the prompt in one tab dismisses it in the others.
//
// Kept identical in the admin panel and the business portal.

const IDLE_MINUTES = 15;
const WARN_SECONDS = 60;
// Beyond this the computer has been left for good: end the session without asking.
const MAX_IDLE_MINUTES = 60;
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "wheel", "touchstart", "click"];

export default function SessionTimeout({ portal, onTimeout }) {
  const key = `session-activity:${portal}`;
  // When the question was first put to the user, so its minute is counted from
  // there and survives a refresh or a second tab.
  const warnKey = `session-warning:${portal}`;
  const [secondsLeft, setSecondsLeft] = useState(null); // null = not warning
  const warning = secondsLeft !== null;
  const warningRef = useRef(false);
  warningRef.current = warning;
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;
  const firedRef = useRef(false);

  const read = () => { try { return Number(localStorage.getItem(key)) || Date.now(); } catch { return Date.now(); } };
  const touch = () => { try { localStorage.setItem(key, String(Date.now())); localStorage.removeItem(warnKey); } catch { /* storage unavailable */ } };
  const readWarnStart = () => { try { return Number(localStorage.getItem(warnKey)) || null; } catch { return null; } };
  const setWarnStart = (t) => { try { localStorage.setItem(warnKey, String(t)); } catch { /* storage unavailable */ } };

  useEffect(() => {
    // Starting up counts as activity only if the last recorded activity is
    // long gone (a fresh sign-in after a past session). A re-mount mid-session
    // — the layout rebuilding itself — must not quietly restart the 15 minutes.
    let stored = null;
    try { stored = Number(localStorage.getItem(key)) || null; } catch { /* storage unavailable */ }
    if (!stored || Date.now() - stored > MAX_IDLE_MINUTES * 60 * 1000) touch();
    let lastWrite = Date.now();
    // While the prompt is up, only its button counts as a reply: moving the
    // mouse must not dismiss it.
    //
    // A mouse that has not moved does not count. Chrome re-sends a "mousemove"
    // with the same coordinates whenever the page under a still cursor changes
    // (the sidebar badges refresh every minute, for one), and each of those
    // was restarting the 15 minutes — so nobody was ever signed out.
    let lastX = null, lastY = null;

    // Reads the clock and acts on it: sign out, show the warning, or all clear.
    // Returns where things stand, so a touch can be judged against the real
    // time that has passed, not against a timer that may have been asleep.
    const limit = IDLE_MINUTES * 60 * 1000;
    function evaluate() {
      if (firedRef.current) return "out";
      const now = Date.now();
      const idleMs = now - read();
      // Left for good: nobody to ask.
      if (idleMs >= MAX_IDLE_MINUTES * 60 * 1000) {
        firedRef.current = true;
        timeoutRef.current?.();
        return "out";
      }
      if (idleMs >= limit) {
        // Ask first. The minute to answer starts when the question is first
        // shown (remembered, so a refresh or another tab shares it).
        let started = readWarnStart();
        if (!started || started < now - idleMs) { started = now; setWarnStart(started); }
        const left = WARN_SECONDS * 1000 - (now - started);
        if (left <= 0) {
          firedRef.current = true;
          timeoutRef.current?.();
          return "out";
        }
        setSecondsLeft(Math.max(1, Math.ceil(left / 1000)));
        return "warning";
      }
      setSecondsLeft((v) => (v === null ? v : null));
      return "active";
    }

    function onActivity(e) {
      if (warningRef.current) return;
      if (e?.type === "mousemove") {
        const moved = lastX === null || Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) >= 3;
        lastX = e.clientX; lastY = e.clientY;
        if (!moved) return;
      }
      // A computer that went to sleep, or a tab the browser froze, stops this
      // page's timers — so the 15 minutes can pass with nothing noticing. The
      // first touch on waking used to reset the clock before anything had
      // looked at it, and nobody was ever signed out. Check the time first:
      // only a touch within the allowed window counts as activity.
      if (evaluate() !== "active") return;
      const now = Date.now();
      if (now - lastWrite > 1000) { lastWrite = now; touch(); }
    }
    for (const e of EVENTS) window.addEventListener(e, onActivity, { passive: true });

    // Coming back to the tab, waking the computer, regaining the network: look
    // at the clock straight away rather than waiting for the next tick.
    const onWake = () => { if (document.visibilityState !== "hidden") evaluate(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    window.addEventListener("online", onWake);

    const tick = setInterval(evaluate, 1000);

    return () => {
      clearInterval(tick);
      for (const e of EVENTS) window.removeEventListener(e, onActivity);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
      window.removeEventListener("online", onWake);
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

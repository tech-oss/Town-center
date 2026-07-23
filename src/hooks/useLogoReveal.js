import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * The 6-phase cinematic brand reveal for the site chrome (header / footer
 * logos) — the compact edition of the fullscreen intro in
 * components/LogoAnimation, matching the reference storyboard:
 *
 *   1. Fade in        — the mark begins hidden behind a closed reveal mask.
 *   2. Stroke draw     — a diagonal light mask uncovers the luminous ghost of
 *                        the mark while a soft teal glow rides the draw edge.
 *   3. Form complete   — the true-colour mark crossfades in and settles
 *                        (0.96 → 1.01 → 1).
 *   4. Text reveal     — the wordmark fades + slides up (blur → sharp).
 *   5. Tagline appear  — the tagline fades in just after.
 *   6. Light sweep     — one glass sweep crosses the mark, then everything is
 *      & settle          perfectly still (subtle glow only, no looping).
 *
 * Total ≈ 2.2s (within the 2–3s spec). Professional restraint:
 *  · Plays ONCE per browser session (sessionStorage) — SPA navigation and
 *    reloads within the session never replay it.
 *  · The footer variant waits until its lockup first scrolls into view.
 *  · prefers-reduced-motion skips everything — the finished logo just shows.
 *  · Only transforms / opacity / filters / the mask var are animated; layout
 *    never moves. will-change is applied only for the timeline's duration.
 *
 * Expected DOM inside rootRef (from BrandMark + the lockup markup); multiple
 * lockups per root are fine (the footer has desktop + mobile variants):
 *   [data-logo-markwrap] [data-logo-mark] [data-logo-ghost]
 *   [data-logo-glow] [data-logo-sweep] [data-logo-word] [data-logo-tag]
 */
const SESSION_PREFIX = "mh-logo-reveal:";

function hasPlayed(id) {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function markPlayed(id) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + id, "1");
  } catch {
    /* private mode — replaying next load is acceptable */
  }
}

export default function useLogoReveal(rootRef, { id, whenVisible = false } = {}) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wrap = root.querySelectorAll("[data-logo-markwrap]");
    if (!wrap.length) return;
    const color = root.querySelectorAll("[data-logo-mark]");
    const ghost = root.querySelectorAll("[data-logo-ghost]");
    const glow = root.querySelectorAll("[data-logo-glow]");
    const sweep = root.querySelectorAll("[data-logo-sweep]");
    const words = root.querySelectorAll("[data-logo-word]");
    const tags = root.querySelectorAll("[data-logo-tag]");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || hasPlayed(id)) return; // static logo (CSS defaults), no work

    let io;
    const ctx = gsap.context(() => {
      // Hide everything the timeline will bring in, synchronously and before
      // paint (useLayoutEffect), so there is never a flash of the finished
      // logo. --reveal:0 closes the diagonal mask; the ghost shows THROUGH it
      // as it opens, so the ghost stays autoAlpha:1.
      gsap.set(wrap, { "--reveal": 0 });
      gsap.set(ghost, { autoAlpha: 1 });
      gsap.set(color, { autoAlpha: 0 });
      gsap.set([...glow, ...sweep], { autoAlpha: 0 });
      gsap.set(words, { autoAlpha: 0, y: 10, filter: "blur(6px)", willChange: "transform, filter" });
      gsap.set(tags, { autoAlpha: 0, y: 8 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.out" },
        onComplete: () => {
          gsap.set(words, { clearProps: "willChange" });
          markPlayed(id);
        },
      });

      // ── Phase 2 · Stroke draw (0 → 0.75s) ──
      tl.to(wrap, { "--reveal": 1, duration: 0.75, ease: "none" }, 0)
        .fromTo(
          glow,
          { xPercent: -70, autoAlpha: 0 },
          { xPercent: 70, autoAlpha: 0.9, duration: 0.75, ease: "none" },
          0
        )
        .to(glow, { autoAlpha: 0, duration: 0.3, ease: "sine.out" }, 0.6);

      // ── Phase 3 · Form complete — colour crossfade + settle (0.6 → 1.0s) ──
      tl.to(color, { autoAlpha: 1, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .to(ghost, { autoAlpha: 0, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .fromTo(
          wrap,
          { scale: 0.96 },
          { scale: 1.01, duration: 0.28, ease: "power1.inOut" },
          0.6
        )
        .to(wrap, { scale: 1, duration: 0.22, ease: "power1.out" }, 0.88);

      // ── Phase 4 · Text reveal (0.95 → 1.4s) ──
      tl.to(words, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, 0.95);

      // ── Phase 5 · Tagline appear (1.35 → 1.7s) ──
      tl.to(tags, { autoAlpha: 1, y: 0, duration: 0.4, ease: "sine.out" }, 1.35);

      // ── Phase 6 · Light sweep & settle (1.6 → 2.2s) ──
      tl.fromTo(
        sweep,
        { xPercent: -160, autoAlpha: 0 },
        { xPercent: 160, autoAlpha: 0.5, duration: 0.6, ease: "sine.inOut" },
        1.6
      ).to(sweep, { autoAlpha: 0, duration: 0.18, ease: "sine.out" }, 2.05);

      // Dev-only: expose the timeline so it can be scrubbed from the console
      // / automated checks (backgrounded tabs suspend requestAnimationFrame).
      if (import.meta.env.DEV) {
        window.__logoReveal = { ...(window.__logoReveal || {}), [id]: tl };
      }

      if (whenVisible) {
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              tl.play();
              io.disconnect();
            }
          },
          { threshold: 0.5 }
        );
        wrap.forEach((m) => io.observe(m));
      } else {
        tl.play();
      }
    }, root);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, [rootRef, id, whenVisible]);
}

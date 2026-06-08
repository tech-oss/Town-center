import { useState } from "react";
import { newsletter } from "../Data/content";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (email) setSubmitted(true);
  }

  return (
    <section
      id="newsletter"
      className="py-24 px-6 md:px-12"
      style={{ backgroundColor: "var(--forest)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>
          {newsletter.eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {newsletter.heading}
        </h2>
        <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
          {newsletter.body}
        </p>

        {submitted ? (
          <p className="text-lg font-semibold" style={{ color: "var(--sage)" }}>
            You're in! Check your inbox.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={newsletter.placeholder}
              className="flex-1 max-w-sm px-5 py-3.5 rounded-full text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/50 transition-colors duration-150"
            />
            <button
              type="submit"
              className="px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 shrink-0"
              style={{ backgroundColor: "var(--sage)" }}
            >
              {newsletter.buttonLabel}
            </button>
          </form>
        )}

        <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {newsletter.disclaimer}
        </p>
      </div>
    </section>
  );
}

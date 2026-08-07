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
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
          {newsletter.eyebrow}
        </p>
        <p className="text-base leading-relaxed mb-10" style={{ color: "#000000" }}>
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
              className="flex-1 max-w-sm px-5 py-3.5 rounded-full text-sm border focus:outline-none transition-colors duration-150"
              style={{ backgroundColor: "rgba(0,0,0,0.03)", color: "#000000", borderColor: "rgba(0,0,0,0.12)" }}
            />
            <button
              type="submit"
              className="px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 shrink-0"
              style={{ backgroundColor: "var(--forest)" }}
            >
              {newsletter.buttonLabel}
            </button>
          </form>
        )}

        <p className="text-xs mt-5" style={{ color: "#000000" }}>
          {newsletter.disclaimer}
        </p>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { useEffect } from "react";
import { live } from "../Data/live";
import BookingForm from "./BookingForm";
import LocationMap from "./LocationMap";

export default function EnquirePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      <section className="relative h-[34vh] min-h-[240px] w-full overflow-hidden">
        <img src={live.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.4) 0%, rgba(28,46,56,0.82) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-10">
          <nav className="mb-3 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/live" className="hover:text-white">Live</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">Enquire</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">Enquire</h1>
        </div>
      </section>

      <section className="py-14 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_480px] gap-10 lg:gap-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>Speak to the Maidenhead Residential team</h2>
            <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "var(--ink)", opacity: 0.82 }}>
              Whether you're buying, renting or simply exploring your options, our team is here to help you find the
              right home in Maidenhead. Send us your details and we'll be in touch to arrange a viewing or answer any questions.
            </p>
            <div className="flex flex-col gap-4">
              {[["📞", "Call us", "01628 000 000"], ["✉️", "Email", "residential@maidenhead.example"], ["📍", "Visit", "The Colonnade, High Street, Maidenhead SL6 1QJ"]].map(([icon, k, v]) => (
                <div key={k} className="flex items-center gap-4">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: "var(--mint)" }}>{icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{k}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--forest)" }}>{v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <BookingForm title="Send an enquiry" subtitle="We'll get back to you within one working day." />
        </div>
      </section>

      {/* Map */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Find us" note="The Colonnade, High Street, Maidenhead SL6 1QJ" lat={51.5234} lng={-0.7205} query="Maidenhead, Berkshire" />
        </div>
      </section>
    </div>
  );
}

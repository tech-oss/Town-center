import { useState } from "react";

// Reusable enquiry / "Book a Viewing" form.
// Session-only React state — it does NOT submit anywhere; on submit it simply
// shows a success message (matches the site's no-storage / no-backend approach).
export default function BookingForm({ title = "Book a Viewing", subtitle, propertyName, compact = false }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    enquiryType: "Viewing",
    message: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-3xl p-8 text-center" style={{ backgroundColor: "var(--mint)" }}>
        <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--forest)" }}>Thank you, {form.firstName || "there"}!</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.8 }}>
          Your enquiry{propertyName ? ` about ${propertyName}` : ""} has been received. A member of the
          Maidenhead Residential team will be in touch shortly to confirm the details.
        </p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-shadow focus:ring-2";
  const inputStyle = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.15)", color: "var(--ink)" };
  const labelCls = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: "var(--forest)" };

  return (
    <form onSubmit={onSubmit} className={`rounded-3xl ${compact ? "p-6" : "p-7 md:p-8"}`} style={{ backgroundColor: "#fff", boxShadow: "0 14px 50px -26px rgba(28,46,56,0.4)" }}>
      <h3 className="text-xl md:text-2xl font-bold" style={{ color: "var(--forest)" }}>{title}</h3>
      {subtitle && <p className="text-sm mt-1 mb-5" style={{ color: "var(--ink)", opacity: 0.65 }}>{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>First name</label>
          <input required className={inputCls} style={inputStyle} value={form.firstName} onChange={set("firstName")} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Last name</label>
          <input required className={inputCls} style={inputStyle} value={form.lastName} onChange={set("lastName")} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Email address</label>
          <input required type="email" className={inputCls} style={inputStyle} value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Phone</label>
          <input required type="tel" className={inputCls} style={inputStyle} value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Preferred date</label>
          <input type="date" className={inputCls} style={inputStyle} value={form.date} onChange={set("date")} />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Enquiry type</label>
          <select className={inputCls} style={inputStyle} value={form.enquiryType} onChange={set("enquiryType")}>
            <option>Viewing</option>
            <option>For Sale</option>
            <option>For Rent</option>
            <option>General enquiry</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls} style={labelStyle}>Message</label>
        <textarea rows={compact ? 3 : 4} className={inputCls} style={inputStyle} value={form.message} onChange={set("message")}
          placeholder={propertyName ? `I'd like to arrange a viewing of ${propertyName}…` : "How can we help?"} />
      </div>

      <button
        type="submit"
        className="mt-5 w-full py-3.5 rounded-full font-semibold text-white transition-colors"
        style={{ backgroundColor: "var(--leaf)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
      >
        Submit Enquiry
      </button>
      <p className="text-[11px] text-center mt-3" style={{ color: "var(--ink)", opacity: 0.5 }}>
        We care about your data. Read our Privacy Policy.
      </p>
    </form>
  );
}

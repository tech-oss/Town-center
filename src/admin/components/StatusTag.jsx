const COLOURS = {
  Active:        { bg: "rgba(22,163,74,0.14)",  text: "#15803D" },
  Approved:      { bg: "rgba(22,163,74,0.14)",  text: "#15803D" },
  Suspended:     { bg: "rgba(217,119,6,0.14)",  text: "#92400E" },
  Published:     { bg: "rgba(37,99,235,0.16)", text: "#1D4ED8" },
  Paid:          { bg: "rgba(37,99,235,0.16)", text: "#1D4ED8" },
  Pending:       { bg: "rgba(217,119,6,0.13)",   text: "#92400E" },
  Trial:         { bg: "rgba(217,119,6,0.13)",   text: "#92400E" },
  Draft:         { bg: "rgba(107,114,128,0.13)", text: "#374151" },
  Lapsed:        { bg: "rgba(107,114,128,0.13)", text: "#374151" },
  Rejected:      { bg: "rgba(185,28,28,0.1)",   text: "#991B1B" },
  Failed:        { bg: "rgba(185,28,28,0.1)",   text: "#991B1B" },
  Downgraded:    { bg: "rgba(217,119,6,0.13)",   text: "#92400E" },
  "Auto-published": { bg: "rgba(16,24,40,0.1)", text: "#1E293B" },
};

export default function StatusTag({ status }) {
  const c = COLOURS[status] ?? { bg: "rgba(107,114,128,0.13)", text: "#374151" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

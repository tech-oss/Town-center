// Shared admin design tokens. These values were previously redeclared at the
// top of nearly every page, which let small drifts creep in (MUTED was both
// #64748B and #6B7280, BORDER both 0.08 and 0.12 alpha).

export const NAVY = "#1E293B";
export const BLUE = "#2563EB";
export const MUTED = "#64748B";
export const BORDER = "rgba(16,24,40,0.12)";

export const CARD = {
  backgroundColor: "#fff",
  border: "1px solid #eef1f6",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
};

export const FIELD_STYLE = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

export const STATUS_COLOURS = {
  Approved: { bg: "rgba(37,99,235,0.12)", fg: BLUE },
  Live: { bg: "rgba(37,99,235,0.12)", fg: BLUE },
  Published: { bg: "rgba(37,99,235,0.12)", fg: BLUE },
  "Pending Approval": { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Pending: { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Rejected: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Suspended: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Cancelled: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Hidden: { bg: "rgba(100,116,139,0.12)", fg: MUTED },
  Draft: { bg: "rgba(107,114,128,0.13)", fg: "#374151" },
};

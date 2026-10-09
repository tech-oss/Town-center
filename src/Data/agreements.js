// The four agreements every business accepts before it gets an account —
// at registration and when claiming a listing. The PDFs live in
// public/agreements/. When a document changes, put the new PDF in place and
// bump its version so new acceptances record which one was agreed to.
export const AGREEMENTS = [
  {
    key: "data-processing-agreement",
    title: "Business Data Processing & Partner Data Responsibility Agreement",
    file: "/agreements/data-processing-agreement.pdf",
    version: "28.09.26",
  },
  {
    key: "privacy-policy",
    title: "Privacy Policy",
    file: "/agreements/privacy-policy.pdf",
    version: "28.09.26",
  },
  {
    key: "terms-of-use",
    title: "Terms of Use",
    file: "/agreements/terms-of-use.pdf",
    version: "28.09.26",
  },
  {
    key: "cancellation-policy",
    title: "Business Subscription & Promotional Service Cancellation Policy",
    file: "/agreements/cancellation-policy.pdf",
    version: "28.09.26",
  },
];

// "9 Oct 2026, 14:35"
export const formatAcceptedAt = (iso) => (iso
  ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "");

export const allAgreed = (accepted) => AGREEMENTS.every((a) => !!accepted?.[a.key]);

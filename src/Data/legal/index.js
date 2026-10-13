// The public Privacy Policy and Terms of Use, from the client's documents
// (Maidenhead Public Privacy Policy / Terms of Use Policy, 28.09.26). Each is
// the document's own text as HTML: headings, paragraphs and lists only.
//
// Admin edits both in Site Content (Privacy Policy / Terms of Use tabs); the
// edited text is saved in site_content under `key`. These files are the
// original documents, shown until admin saves a version and again if admin
// restores the original.
import privacyHtml from "./privacy.html?raw";
import termsHtml from "./terms.html?raw";

export const LEGAL = {
  privacy: { key: "legal-privacy", title: "Privacy Policy", html: privacyHtml, path: "/privacy" },
  terms: { key: "legal-terms", title: "Terms of Use", html: termsHtml, path: "/terms" },
};

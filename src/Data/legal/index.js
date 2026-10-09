// The public Privacy Policy and Terms of Use, from the client's documents
// (Maidenhead Public Privacy Policy / Terms of Use Policy, 28.09.26). Each is
// the document's own text as HTML: headings, paragraphs and lists only.
// To update, convert the new .docx and replace the matching .html file.
import privacyHtml from "./privacy.html?raw";
import termsHtml from "./terms.html?raw";

export const LEGAL = {
  privacy: { title: "Privacy Policy", html: privacyHtml },
  terms: { title: "Terms of Use", html: termsHtml },
};

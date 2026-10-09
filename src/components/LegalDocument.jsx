// The text of a legal document (lib: Data/legal), styled for reading — used by
// the website's /privacy and /terms pages and the app's matching screens.
// The HTML is the client's own document, converted from Word and limited to
// headings, paragraphs, lists and bold text.
export default function LegalDocument({ html, compact = false }) {
  return (
    <div
      className={[
        "legal-document",
        compact ? "text-sm" : "text-[15px] md:text-base",
        "leading-relaxed text-black",
        "[&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-8 [&_h2]:mb-3",
        compact ? "[&_h2]:text-base" : "[&_h2]:text-xl md:[&_h2]:text-2xl",
        "[&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-1.5",
        "[&_b]:font-semibold [&_a]:underline [&_a]:text-[var(--teal-deep)]",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

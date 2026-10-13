import { useMemo } from "react";
import { cleanLegalHtml, legalDocumentClass } from "../lib/legalHtml";

// The text of a legal document, styled for reading — used by the website's
// /privacy and /terms pages and the app's matching screens. The text is
// admin-edited (or the client's original document), cleaned to headings,
// paragraphs, lists, bold, italic, underline and links before it is shown.
export default function LegalDocument({ html, compact = false }) {
  const clean = useMemo(() => cleanLegalHtml(html), [html]);
  return <div className={legalDocumentClass(compact)} dangerouslySetInnerHTML={{ __html: clean }} />;
}

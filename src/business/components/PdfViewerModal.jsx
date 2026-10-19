import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B";

// A legal document's PDF in a popup: read it, print it, close it. Its links
// skip the "Leaving our website" check — a PDF admin uploads lives in file
// storage on another web address, but it is our own document.
//   doc: { name, version, effectiveDate (label), fileUrl } — null to close.
export default function PdfViewerModal({ doc, onClose }) {
  const frame = useRef(null);

  useEffect(() => {
    if (!doc) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [doc, onClose]);

  if (!doc) return null;

  // Prints the PDF in the frame; a PDF on another site (admin uploads live in
  // storage) can't be printed from here, so that opens in a tab to print.
  function print() {
    try {
      frame.current.contentWindow.focus();
      frame.current.contentWindow.print();
    } catch {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-6" style={{ backgroundColor: "rgba(15,23,42,0.6)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={doc.name}
        className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: "1px solid rgba(16,24,40,0.1)" }}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: FOREST }}>{doc.name}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Version {doc.version}{doc.effectiveDate ? ` · Effective ${doc.effectiveDate}` : ""}
            </p>
          </div>
          <button type="button" onClick={print}
            className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: SAGE }}>
            Print
          </button>
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm
            className="hidden sm:inline-block px-3 py-2 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(16,24,40,0.15)", color: FOREST }}>
            Open in new tab
          </a>
          <button type="button" onClick={onClose} aria-label="Close"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: FOREST }}>
            Close
          </button>
        </div>
        <iframe ref={frame} title={doc.name} src={doc.fileUrl} className="flex-1 w-full" style={{ border: 0, backgroundColor: "#f1f5f9" }} />
        {/* Phones often show only the first page of a PDF in a frame. */}
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm
          className="sm:hidden text-center text-xs font-semibold py-2.5" style={{ color: SAGE, borderTop: "1px solid rgba(16,24,40,0.1)" }}>
          Open the full document
        </a>
      </div>
    </div>,
    document.body,
  );
}

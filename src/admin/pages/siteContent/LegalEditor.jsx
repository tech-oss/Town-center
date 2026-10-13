import { useState } from "react";
import RichTextEditor from "../../components/RichTextEditor";
import { LEGAL } from "../../../Data/legal";
import { legalDocumentClass } from "../../../lib/legalHtml";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../../theme";

// Site Content → Privacy Policy / Terms of Use: the whole page as one free
// document. `doc` is "privacy" or "terms"; `values` is { title, html } as
// saved plus anything typed since. An empty html means "the original
// document" (Data/legal), which is also what the editor starts from.
export default function LegalEditor({ doc, values, onChange }) {
  const original = LEGAL[doc];
  // Bumped to reload the editor's text (restore original).
  const [version, setVersion] = useState(0);
  const html = typeof values.html === "string" && values.html.trim() ? values.html : original.html;
  const usingOriginal = !(typeof values.html === "string" && values.html.trim());

  function restore() {
    if (!confirm(`Replace the text with the original ${original.title}? Your changes are lost when you save.`)) return;
    onChange("html", "");
    onChange("title", "");
    setVersion((v) => v + 1);
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
      <div>
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>{original.title}</h2>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          The whole page, on the website and in the app. Type, delete and format freely; paste from
          Word or Google Docs to bring in a new version (headings, bold, lists and links are kept).
        </p>
        <div className="flex gap-4 mt-1.5">
          <a href={original.path} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: BLUE }}>
            View on website ↗
          </a>
          <a href={`/mobile${original.path}`} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: BLUE }}>
            View in app ↗
          </a>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Page title</span>
        <input
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}
          value={values.title ?? ""}
          placeholder={original.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold flex-1" style={{ color: MUTED }}>Page text</span>
          {usingOriginal
            ? <span className="text-[11px]" style={{ color: MUTED }}>Showing the original document</span>
            : (
              <button type="button" onClick={restore} className="text-xs font-semibold" style={{ color: "#991B1B" }}>
                Restore original
              </button>
            )}
        </div>
        <RichTextEditor
          key={version}
          value={html}
          onChange={(v) => onChange("html", v)}
          className={legalDocumentClass(true)}
          placeholder={`Type the ${original.title} here…`}
        />
        <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
          Use “Heading” for numbered sections such as “1. Who We Are”. Saving an empty page puts the original document back.
        </span>
      </div>
    </div>
  );
}

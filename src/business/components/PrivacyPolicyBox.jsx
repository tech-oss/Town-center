import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { cleanLegalHtml, legalDocumentClass } from "../../lib/legalHtml";
import originalPrivacy from "../../Data/legal/privacy.html?raw";

const MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";

// The Privacy Policy in a scroll box — for reading, no acceptance needed. It
// is the same text as the site's /privacy page: the version Maidenhead admin
// edits in Site Content → Privacy Policy (site_content 'legal-privacy'), or
// the original document until admin has saved one.
export default function PrivacyPolicyBox() {
  const [saved, setSaved] = useState(undefined);
  useEffect(() => {
    let alive = true;
    supabase.from("site_content").select("content").eq("key", "legal-privacy").maybeSingle()
      .then(({ data }) => { if (alive) setSaved(data?.content ?? null); }, () => { if (alive) setSaved(null); });
    return () => { alive = false; };
  }, []);
  const html = typeof saved?.html === "string" && saved.html.trim() ? saved.html : originalPrivacy;
  const clean = useMemo(() => cleanLegalHtml(html), [html]);
  const title = (typeof saved?.title === "string" && saved.title.trim()) || "Privacy Policy";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{title}</p>
      <p className="text-[11px] -mt-1" style={{ color: MUTED }}>How we handle your and your customers' information. For reading — nothing to tick.</p>
      <div className="rounded-xl p-4 max-h-64 overflow-y-auto" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
        {saved === undefined
          ? <p className="text-xs" style={{ color: MUTED }}>Loading…</p>
          : <div className={legalDocumentClass(true)} dangerouslySetInnerHTML={{ __html: clean }} />}
      </div>
    </div>
  );
}

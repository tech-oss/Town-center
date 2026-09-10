import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getBusinessArticles, approveArticle, rejectArticle } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ReviewActions from "../components/ReviewActions";
import Toast from "../components/Toast";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

const FILTERS = ["Pending Approval", "Live", "Rejected", "All"];

export default function ArticleApprovalsPage() {
  const [filter, setFilter] = useState("Pending Approval");
  const [nonce, setNonce] = useState(0);
  const [toast, setToast] = useState("");
  const { data: articles, loading } = useFetch(() => getBusinessArticles({ status: filter }), [filter, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  async function handleApprove(a) {
    const res = await approveArticle(a.id);
    flash(res.live
      ? `"${a.title}" is now live.`
      : `"${a.title}" approved. ${a.businessName} already has 3 articles live, so it's held until they swap one out.`);
    refresh();
  }
  async function handleReject(a, reason) {
    await rejectArticle(a.id, reason);
    flash(`"${a.title}" rejected.`);
    refresh();
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Business News &amp; Offers</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
        Review the news posts and offers businesses submit for their listing. Rejecting one sends your reason back to the business.
      </p>

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={filter === f
              ? { backgroundColor: BLUE, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : !articles?.length ? (
        <EmptyState title="Nothing here" message={`No business posts with status "${filter}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <div key={a.id} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{a.title}</p>
                    <StatusTag status={a.status} />
                    {a.type && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.type}</span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>{a.businessName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {a.date}
                    {a.startDate ? ` · runs ${a.startDate}${a.endDate ? ` – ${a.endDate}` : ""}` : ""}
                  </p>
                  {a.body && <p className="text-xs mt-2 line-clamp-4" style={{ color: MUTED }}>{a.body}</p>}
                  {a.status === "Rejected" && a.rejectionReason && (
                    <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>Rejected: {a.rejectionReason}</p>
                  )}
                </div>
                {a.heroImage && <img src={a.heroImage} alt="" className="w-24 h-24 rounded-xl object-cover" />}
              </div>
              {a.status === "Pending Approval" && (
                <ReviewActions onApprove={() => handleApprove(a)} onReject={(r) => handleReject(a, r)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

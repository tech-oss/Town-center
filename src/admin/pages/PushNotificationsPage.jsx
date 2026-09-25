import { useCallback, useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getPushHistory, sendPush,
  getPushRequests, approvePushRequest, rejectPushRequest, countPendingPushRequests,
} from "../../api/admin";
import ArticleTypeahead from "../components/ArticleTypeahead";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { formatUK } from "../../lib/ukDate";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm" style={{ backgroundColor: "#2563EB", color: "#fff" }}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// Live preview of how the push looks on a device. When an article/offer is
// attached, its image renders above the text, matching rich push
// notifications on iOS/Android; with no attachment it falls back to the
// existing text-only layout.
function PushPreview({ title, body, channel, image }) {
  const isMobile = channel === "mobile";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{isMobile ? "Mobile lock screen" : "Web / desktop"}</span>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: isMobile ? "rgba(16,24,40,0.06)" : "#fff", border: "1px solid rgba(16,24,40,0.12)", boxShadow: "0 2px 10px rgba(13,42,51,0.08)" }}
      >
        {image && (
          <img src={image} alt="" className="w-full object-cover" style={{ height: isMobile ? 120 : 140 }} />
        )}
        <div className="p-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: "#2563EB" }}>
            <span>🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold" style={{ color: "#1E293B" }}>Maidenhead Town Centre</span>
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>now</span>
            </div>
            <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#1E293B" }}>{title || "Notification title"}</p>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{body || "Your message will appear here…"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposeTab() {
  const [form, setForm] = useState({ title: "", body: "", url: "", audience: "all", web: true, mobile: true, notifType: "simple", attachedArticle: null });
  const [nonce, setNonce] = useState(0);
  const { data: fetchedHistory } = useFetch(getPushHistory, [nonce]);
  const history = fetchedHistory ?? [];
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSelectArticle(article) {
    setForm((f) => ({
      ...f,
      attachedArticle: article,
      title: article ? article.title : f.title,
      url: article ? article.link : f.url,
    }));
  }
  const channels = [form.web && "Web", form.mobile && "Mobile"].filter(Boolean);
  const isValid = form.title.trim() && form.body.trim() && channels.length > 0;

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSend() {
    if (!isValid) return;
    const result = await sendPush(form);
    setNonce((n) => n + 1);
    setForm({ title: "", body: "", url: "", audience: "all", web: true, mobile: true, notifType: "simple", attachedArticle: null });
    setConfirm(false);
    // Delivery needs the send-push Edge Function deployed (see its header
    // comment) — until then this reports as recorded-only rather than sent.
    if (result.delivery?.error) {
      notify(`Recorded — delivery isn't live yet (${result.delivery.error}).`);
    } else if (result.delivery) {
      notify(`Sent to ${result.delivery.sent}/${result.delivery.total} subscribed device(s).`);
    } else {
      notify(`Notification sent via ${channels.join(" & ")}.`);
    }
  }

  const field = { border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" };

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Compose form */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
          <h2 className="font-bold text-base" style={{ color: "#1E293B" }}>Compose Notification</h2>

          {/* Notification type */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Notification Type</span>
            <div className="flex gap-3 flex-wrap">
              {[["simple", "Simple text"], ["attach", "Attach article/offer"]].map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => { set("notifType", key); if (key === "simple") handleSelectArticle(null); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={form.notifType === key
                    ? { backgroundColor: "rgba(16,24,40,0.1)", color: "#1E293B", border: "1.5px solid #1E293B" }
                    : { backgroundColor: "#fff", color: "#6B7280", border: "1.5px solid rgba(16,24,40,0.15)" }
                  }
                >
                  {form.notifType === key ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          {form.notifType === "attach" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Article / Offer</span>
              <ArticleTypeahead selected={form.attachedArticle} onSelect={handleSelectArticle} />
            </label>
          )}

          {form.attachedArticle && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Attached Image</span>
              <div className="flex items-center gap-3 rounded-xl p-2" style={{ ...field, backgroundColor: "#f8fafc" }}>
                <img src={form.attachedArticle.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover" />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>Locked to the attached article's image.</span>
              </div>
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Title *</span>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={65} placeholder="e.g. New offers in town this week" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
            <span className="text-[11px] self-end" style={{ color: "#9CA3AF" }}>{form.title.length}/65</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Message *</span>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={180} rows={3} placeholder="The body text shown in the notification…" className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={field} />
            <span className="text-[11px] self-end" style={{ color: "#9CA3AF" }}>{form.body.length}/180</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Link / deep link (optional)</span>
            <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="/news or https://…" className="rounded-xl px-3 py-2.5 text-sm outline-none font-mono" style={field} />
            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>Where users land when they tap the notification. {form.attachedArticle ? "Auto-filled from the attached article — still editable." : ""}</span>
          </label>

          {/* Channels */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Channels *</span>
            <div className="flex gap-3 flex-wrap">
              {[["mobile", "📱 Mobile (iOS & Android)"], ["web", "💻 Web (browser)"]].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(key, !form[key])}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={form[key]
                    ? { backgroundColor: "rgba(16,24,40,0.1)", color: "#1E293B", border: "1.5px solid #1E293B" }
                    : { backgroundColor: "#fff", color: "#6B7280", border: "1.5px solid rgba(16,24,40,0.15)" }
                  }
                >
                  {form[key] ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
            {!confirm ? (
              <button
                type="button"
                onClick={() => isValid && setConfirm(true)}
                disabled={!isValid}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#2563EB" }}
              >
                Send Notification
              </button>
            ) : (
              <>
                <span className="text-sm font-medium" style={{ color: "#1E293B" }}>Send to everyone subscribed?</span>
                <button type="button" onClick={handleSend} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#2563EB" }}>Confirm Send</button>
                <button type="button" onClick={() => setConfirm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>Cancel</button>
              </>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
          <h2 className="font-bold text-base" style={{ color: "#1E293B" }}>Preview</h2>
          {form.mobile && <PushPreview title={form.title} body={form.body} channel="mobile" image={form.attachedArticle?.thumbnail} />}
          {form.web && <PushPreview title={form.title} body={form.body} channel="web" image={form.attachedArticle?.thumbnail} />}
          {!form.mobile && !form.web && (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Select at least one channel to preview.</p>
          )}
        </div>
      </div>

      {/* Sent history */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <h2 className="font-bold text-base mb-4" style={{ color: "#1E293B" }}>Recently Sent</h2>
        <div className="flex flex-col divide-y" style={{ borderColor: "rgba(16,24,40,0.08)" }}>
          {history.map((n) => (
            <div key={n.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{n.title}</p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6B7280" }}>{n.body}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {n.channels.map((c) => (
                    <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(16,24,40,0.1)", color: "#1E293B" }}>{c}</span>
                  ))}
                  {/* reach is null until delivery reports a number — a send
                      recorded while the send-push function isn't deployed
                      never gets one. This read `n.reach.toLocaleString()`
                      unguarded, which threw and blanked the whole page the
                      moment the history had a single row in it. */}
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    · {n.audience}{typeof n.reach === "number" ? ` · ${n.reach.toLocaleString()} reached` : ""}
                  </span>
                </div>
              </div>
              <span className="text-[11px] shrink-0 whitespace-nowrap" style={{ color: "#9CA3AF" }}>{n.sentAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Business requests ─────────────────────────────────────────────────────
// What businesses have asked to send. Approving sends it there and then;
// rejecting takes a reason, which the business reads on its own Push
// Notifications page.

const REQUEST_FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "All", label: "All" },
];

const REQUEST_STATUS = {
  pending: { label: "Pending", bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  approved: { label: "Approved & sent", bg: "rgba(22,163,74,0.14)", fg: "#15803D" },
  rejected: { label: "Rejected", bg: "rgba(185,28,28,0.1)", fg: "#991B1B" },
};

function RequestsTab({ notify, onCountChange }) {
  const [filter, setFilter] = useState("pending");
  const [nonce, setNonce] = useState(0);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);
  const { data: requests, loading } = useFetch(() => getPushRequests({ status: filter }), [filter, nonce]);

  const refresh = () => { setNonce((n) => n + 1); onCountChange?.(); };

  async function approve(r) {
    setBusy(r.id);
    try {
      const { delivery } = await approvePushRequest(r);
      if (delivery?.error) {
        notify(`Approved and recorded — delivery isn't live yet (${delivery.error}).`);
      } else if (delivery) {
        notify(`Approved — sent to ${delivery.sent}/${delivery.total} subscribed device(s).`);
      } else {
        notify("Approved and sent.");
      }
      refresh();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function reject(r) {
    if (!reason.trim()) return;
    setBusy(r.id);
    try {
      await rejectPushRequest(r, reason);
      notify(`Rejected. ${r.businessName} has been told why.`);
      setRejecting(null);
      setReason("");
      refresh();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 flex-wrap">
        {REQUEST_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={filter === f.key
              ? { backgroundColor: BLUE, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : !requests?.length ? (
        <EmptyState title="Nothing here"
          message={filter === "pending" ? "No businesses are waiting on a push notification." : `No ${filter === "All" ? "" : filter} requests.`} />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => {
            const s = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending;
            return (
              <div key={r.id} className="rounded-2xl p-5" style={CARD}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: NAVY }}>{r.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: MUTED }}>
                      {r.businessName}{r.requestedName ? ` · ${r.requestedName}` : ""} · {formatUK(String(r.createdAt).slice(0, 10))}
                    </p>
                    {r.body && <p className="text-xs mt-2" style={{ color: NAVY }}>{r.body}</p>}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {r.channels.map((c) => (
                        <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ backgroundColor: "rgba(16,24,40,0.1)", color: NAVY }}>{c}</span>
                      ))}
                      {r.url && <span className="text-[11px] font-mono truncate" style={{ color: MUTED }}>→ {r.url}</span>}
                    </div>

                    {r.attachedArticle && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl p-2 w-fit"
                        style={{ backgroundColor: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.18)" }}>
                        {r.attachedArticle.thumbnail && <img src={r.attachedArticle.thumbnail} alt="" className="w-10 h-8 rounded object-cover" />}
                        <span className="text-[11px] font-semibold" style={{ color: NAVY }}>{r.attachedArticle.title}</span>
                      </div>
                    )}

                    {r.status === "rejected" && r.rejectionReason && (
                      <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>Rejected: {r.rejectionReason}</p>
                    )}
                  </div>

                  {/* The same device preview the business saw when writing it. */}
                  <div className="w-full sm:w-72 shrink-0">
                    <PushPreview title={r.title} body={r.body} channel="mobile" image={r.attachedArticle?.thumbnail} />
                  </div>
                </div>

                {r.status === "pending" && (
                  rejecting === r.id ? (
                    <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <label className="text-xs font-semibold" style={{ color: MUTED }}>
                        Why isn't this going out? {r.businessName} is shown this.
                      </label>
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus
                        placeholder="Explain what needs changing…"
                        className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                        style={{ border: `1.5px solid ${BORDER}`, color: NAVY }} />
                      <div className="flex gap-2">
                        <button onClick={() => reject(r)} disabled={busy === r.id || !reason.trim()}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                          style={{ backgroundColor: "#B91C1C" }}>
                          {busy === r.id ? "Rejecting…" : "Reject request"}
                        </button>
                        <button onClick={() => { setRejecting(null); setReason(""); }}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 pt-3 flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <button onClick={() => approve(r)} disabled={busy === r.id}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: BLUE }}>
                        {busy === r.id ? "Sending…" : "Approve & send"}
                      </button>
                      <button onClick={() => { setRejecting(r.id); setReason(""); }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>
                        Reject
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PushNotificationsPage() {
  const [tab, setTab] = useState("compose");
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState(null);

  const loadCount = useCallback(() => {
    countPendingPushRequests().then(setPending).catch(() => {});
  }, []);
  useEffect(loadCount, [loadCount]);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Push Notifications</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Send custom push notifications to mobile and web users, and review the ones businesses have asked you to send.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
        {[["compose", "Compose"], ["requests", "Business Requests"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
            style={tab === key ? { backgroundColor: "#fff", color: NAVY, boxShadow: "0 1px 2px rgba(16,24,40,0.08)" } : { color: MUTED }}>
            {label}
            {key === "requests" && pending > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#DC2626", color: "#fff" }}>{pending}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "compose" ? <ComposeTab /> : <RequestsTab notify={notify} onCountChange={loadCount} />}
    </div>
  );
}

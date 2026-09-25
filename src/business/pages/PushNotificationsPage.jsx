import { useCallback, useEffect, useRef, useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { formatUKDateTime } from "../../lib/ukDateTime";
import { getMyAttachableContent } from "../api/pushAttachments";
import {
  listPushRequests, requestPush, withdrawPushRequest, PUSH_STATUS,
} from "../api/pushRequests";

// Requesting a push notification. The composer is the same one admin uses —
// same fields, same limits, same live preview — because what the business
// writes here is what admin sends, verbatim, on approval. The only
// difference is the button: a business asks, it never broadcasts.

const CATEGORY_COLOURS = {
  News: { bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
  Offer: { bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
  Event: { bg: "rgba(139,92,246,0.14)", fg: "#6D28D9" },
  "Featured Article": { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
};
function CategoryBadge({ category }) {
  const c = CATEGORY_COLOURS[category] ?? { bg: "rgba(107,114,128,0.13)", fg: "#374151" };
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{category}</span>;
}

// Picker for the business's own live content, matching admin's
// ArticleTypeahead but scoped to this business.
function ContentTypeahead({ businessId, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    getMyAttachableContent(businessId).then(setItems).catch(() => setItems([]));
  }, [businessId]);

  useEffect(() => {
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (items ?? []).filter((a) => !q || a.title.toLowerCase().includes(q)).slice(0, 8);

  if (selected) {
    return (
      <div className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(37,99,235,0.25)" }}>
        {selected.thumbnail && <img src={selected.thumbnail} alt="" className="w-6 h-6 rounded object-cover" />}
        <span className="text-sm font-semibold" style={{ color: FOREST }}>{selected.title}</span>
        <CategoryBadge category={selected.category} />
        <button type="button" onClick={() => onSelect(null)} className="text-xs font-bold" style={{ color: SAGE }}>✕</button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search your live news, offers, articles and events…"
        className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
        style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
          {items === null ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>Loading your content…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>
              {items.length === 0
                ? "You have nothing live to attach yet. Publish a news post, Featured Article or event first."
                : "Nothing matches that."}
            </p>
          ) : (
            matches.map((a) => (
              <button key={a.id} type="button"
                onClick={() => { onSelect(a); setQuery(""); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: `1px solid ${BORDER}` }}>
                {a.thumbnail && <img src={a.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate" style={{ color: FOREST }}>{a.title}</span>
                </span>
                <CategoryBadge category={a.category} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// The same device preview admin sees, so both sides are judging the same
// thing before it goes out.
function PushPreview({ title, body, channel, image, businessName }) {
  const isMobile = channel === "mobile";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
        {isMobile ? "Mobile lock screen" : "Web / desktop"}
      </span>
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: isMobile ? "rgba(16,24,40,0.06)" : "#fff", border: "1px solid rgba(16,24,40,0.12)", boxShadow: "0 2px 10px rgba(13,42,51,0.08)" }}>
        {image && <img src={image} alt="" className="w-full object-cover" style={{ height: isMobile ? 120 : 140 }} />}
        <div className="p-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: SAGE }}>
            <span>🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold" style={{ color: FOREST }}>Maidenhead Town Centre</span>
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>now</span>
            </div>
            <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: FOREST }}>{title || "Notification title"}</p>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{body || "Your message will appear here…"}</p>
          </div>
        </div>
      </div>
      {/* Sent under the town's name, not the business's — worth knowing
          before writing it, since "we're open late" reads oddly from the
          town account without saying who. */}
      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
        Sent from the Maidenhead account, so mention {businessName || "your business"} in the title or message.
      </p>
    </div>
  );
}

const BLANK = { title: "", body: "", url: "", web: true, mobile: true, notifType: "simple", attachedArticle: null };

export default function PushNotificationsPage() {
  const { user } = useBusinessAuth();
  const [form, setForm] = useState(BLANK);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);
  const [toast, setToast] = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    listPushRequests(user.id)
      .then(setRequests)
      .catch((e) => setToast(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);
  useEffect(load, [load]);

  function selectArticle(article) {
    setForm((f) => ({
      ...f,
      attachedArticle: article,
      title: article ? article.title : f.title,
      url: article ? article.link : f.url,
    }));
  }

  const channels = [form.web && "Web", form.mobile && "Mobile"].filter(Boolean);
  const isValid = form.title.trim() && form.body.trim() && channels.length > 0;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function submit() {
    if (!isValid) return;
    setBusy(true);
    try {
      await requestPush(user.id, form, `${user.firstName} ${user.lastName}`);
      setForm(BLANK);
      setConfirm(false);
      setToast("Sent to Maidenhead for approval.");
      load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmWithdraw() {
    try {
      await withdrawPushRequest(withdrawing.id);
      setRequests((prev) => prev.filter((r) => r.id !== withdrawing.id));
      setToast("Request withdrawn.");
    } catch (e) {
      setToast(e.message);
    }
    setWithdrawing(null);
  }

  const field = { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" };

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {withdrawing && (
        <ConfirmModal title="Withdraw this request?" body={`"${withdrawing.title}" will be removed before Maidenhead reviews it.`}
          confirmLabel="Withdraw" onConfirm={confirmWithdraw} onCancel={() => setWithdrawing(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Push Notifications</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Ask Maidenhead to send a push notification to everyone with the website or app notifications turned on.
            Maidenhead approves every notification before it goes out, so it won't send the moment you submit it.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* Compose */}
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            <h2 className="font-bold text-base" style={{ color: FOREST }}>Compose Notification</h2>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>Notification Type</span>
              <div className="flex gap-3 flex-wrap">
                {[["simple", "Simple text"], ["attach", "Attach one of your posts"]].map(([key, label]) => (
                  <button key={key} type="button"
                    onClick={() => { set("notifType", key); if (key === "simple") selectArticle(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={form.notifType === key
                      ? { backgroundColor: "rgba(16,24,40,0.1)", color: FOREST, border: `1.5px solid ${FOREST}` }
                      : { backgroundColor: "#fff", color: MUTED, border: "1.5px solid rgba(16,24,40,0.15)" }}>
                    {form.notifType === key ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            </div>

            {form.notifType === "attach" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold" style={{ color: MUTED }}>Your content</span>
                <ContentTypeahead businessId={user.id} selected={form.attachedArticle} onSelect={selectArticle} />
              </label>
            )}

            {form.attachedArticle && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold" style={{ color: MUTED }}>Attached Image</span>
                <div className="flex items-center gap-3 rounded-xl p-2" style={{ ...field, backgroundColor: "#f8fafc" }}>
                  {form.attachedArticle.thumbnail
                    ? <img src={form.attachedArticle.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover" />
                    : <span className="text-xs" style={{ color: MUTED }}>No image on this post.</span>}
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>Locked to the attached post's image.</span>
                </div>
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>Title *</span>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={65}
                placeholder="e.g. Half price coffee at Solas this week"
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <span className="text-[11px] self-end" style={{ color: "#9CA3AF" }}>{form.title.length}/65</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>Message *</span>
              <textarea value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={180} rows={3}
                placeholder="The body text shown in the notification…"
                className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={field} />
              <span className="text-[11px] self-end" style={{ color: "#9CA3AF" }}>{form.body.length}/180</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>Link (optional)</span>
              <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="/news or https://…"
                className="rounded-xl px-3 py-2.5 text-sm outline-none font-mono" style={field} />
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                Where people land when they tap it. {form.attachedArticle ? "Filled in from the post you attached — still editable." : ""}
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>Channels *</span>
              <div className="flex gap-3 flex-wrap">
                {[["mobile", "📱 Mobile (iOS & Android)"], ["web", "💻 Web (browser)"]].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => set(key, !form[key])}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={form[key]
                      ? { backgroundColor: "rgba(16,24,40,0.1)", color: FOREST, border: `1.5px solid ${FOREST}` }
                      : { backgroundColor: "#fff", color: MUTED, border: "1.5px solid rgba(16,24,40,0.15)" }}>
                    {form[key] ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t flex-wrap" style={{ borderColor: BORDER }}>
              {!confirm ? (
                <button type="button" onClick={() => isValid && setConfirm(true)} disabled={!isValid}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: SAGE }}>
                  Request Notification
                </button>
              ) : (
                <>
                  <span className="text-sm font-medium" style={{ color: FOREST }}>Send this to Maidenhead for approval?</span>
                  <button type="button" onClick={submit} disabled={busy}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
                    {busy ? "Sending…" : "Confirm Request"}
                  </button>
                  <button type="button" onClick={() => setConfirm(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            <h2 className="font-bold text-base" style={{ color: FOREST }}>Preview</h2>
            {form.mobile && <PushPreview title={form.title} body={form.body} channel="mobile" image={form.attachedArticle?.thumbnail} businessName={user.businessName} />}
            {form.web && <PushPreview title={form.title} body={form.body} channel="web" image={form.attachedArticle?.thumbnail} businessName={user.businessName} />}
            {!form.mobile && !form.web && (
              <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>Select at least one channel to preview.</p>
            )}
          </div>
        </div>

        {/* Their own requests, and what came of each */}
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-base" style={{ color: FOREST }}>Your Requests</h2>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>
                {pendingCount} waiting
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: MUTED }}>Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>You haven't requested any notifications yet.</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {requests.map((r) => {
                const s = PUSH_STATUS[r.status] ?? PUSH_STATUS.pending;
                return (
                  <div key={r.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: FOREST }}>{r.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: MUTED }}>{r.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {r.channels.map((c) => (
                          <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(16,24,40,0.1)", color: FOREST }}>{c}</span>
                        ))}
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                          · {r.requestedName || "Your team"} · {formatUKDateTime(r.createdAt)}
                        </span>
                      </div>
                      {r.status === "rejected" && r.rejectionReason && (
                        <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>
                          <span className="font-bold">Not approved:</span> {r.rejectionReason}
                        </p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <button onClick={() => setWithdrawing(r)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                        style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>
                        Withdraw
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
}

import { useState } from "react";
import ArticleTypeahead from "../components/ArticleTypeahead";

const AUDIENCES = [
  { key: "all", label: "All users" },
  { key: "businesses", label: "Business owners" },
  { key: "agents", label: "Estate agents" },
  { key: "subscribers", label: "Newsletter subscribers" },
];

// UI-only mock of previously sent notifications.
const SENT_HISTORY = [
  { id: "n1", title: "Summer in the Spotlight", body: "New offers from Coppa Club & COCOBA are live — see what's on this week.", channels: ["Web", "Mobile"], audience: "All users", sentAt: "2026-06-20 09:00", reach: 1240 },
  { id: "n2", title: "New restaurant now open", body: "Spice Garden has joined the Maidenhead directory. Take a look!", channels: ["Mobile"], audience: "All users", sentAt: "2026-06-12 12:30", reach: 1198 },
  { id: "n3", title: "Renew your listing", body: "Your subscription renews soon — keep your business visible in town.", channels: ["Web"], audience: "Business owners", sentAt: "2026-06-01 08:00", reach: 42 },
];

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

export default function PushNotificationsPage() {
  const [form, setForm] = useState({ title: "", body: "", url: "", audience: "all", web: true, mobile: true, notifType: "simple", attachedArticle: null });
  const [history, setHistory] = useState(SENT_HISTORY);
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

  function handleSend() {
    if (!isValid) return;
    const entry = {
      id: `n${Date.now()}`,
      title: form.title,
      body: form.body,
      channels,
      audience: AUDIENCES.find((a) => a.key === form.audience)?.label ?? "All users",
      sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      reach: form.audience === "all" ? 1240 : form.audience === "businesses" ? 42 : form.audience === "agents" ? 8 : 860,
    };
    setHistory((h) => [entry, ...h]);
    setForm({ title: "", body: "", url: "", audience: "all", web: true, mobile: true, notifType: "simple", attachedArticle: null });
    setConfirm(false);
    notify(`Notification sent to ${entry.audience} via ${entry.channels.join(" & ")}.`);
  }

  const field = { border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Push Notifications</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Send custom push notifications to mobile and web users.</p>
      </div>

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

          {/* Audience */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Audience</span>
            <select value={form.audience} onChange={(e) => set("audience", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field}>
              {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </label>

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
                <span className="text-sm font-medium" style={{ color: "#1E293B" }}>Send to {AUDIENCES.find((a) => a.key === form.audience)?.label}?</span>
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
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>· {n.audience} · {n.reach.toLocaleString()} reached</span>
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

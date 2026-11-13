import { useParams, useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useFetch from "../../hooks/useFetch";
import { getPushNotification } from "../lib/pushFeed";
import { openLink } from "../lib/appLinks";

// One notification admin sent, in full: what opens when it's tapped from the
// lock screen or the bell list and it has no link of its own (a plain text
// message). One with a link still offers it, as "Read more".
export default function NotificationScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: n, loading, error } = useFetch(() => getPushNotification(id), [id]);

  const sent = n?.sentAt
    ? new Date(n.sentAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Europe/London" })
    : "";

  return (
    <MobileShell title="Notification" onBack backFallback="/mobile/home">
      {loading && !n ? (
        <p className="text-sm text-center py-16" style={{ color: "rgba(28,46,56,0.6)" }}>Loading…</p>
      ) : !n || error ? (
        <div className="flex flex-col items-center gap-3 text-center py-16">
          <p className="text-sm" style={{ color: "#000000" }}>This notification is no longer available.</p>
          <button type="button" onClick={() => navigate("/mobile/home")} className="text-sm font-bold" style={{ color: "var(--teal-deep)" }}>
            Go to Home
          </button>
        </div>
      ) : (
        <article className="flex flex-col gap-4 pb-8">
          {n.image && (
            <img src={n.image} alt="" className="w-full rounded-2xl object-cover" style={{ aspectRatio: "16 / 9" }} />
          )}
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--forest)" }}>
              <img src="/logo-mark.svg" alt="" className="w-6 h-auto" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>
                {n.category ? `${n.business} · ${n.category}` : n.business}
              </p>
              {sent && <p className="text-[11px]" style={{ color: "rgba(28,46,56,0.65)" }}>{sent}</p>}
            </div>
          </div>
          <h1 className="text-xl font-bold leading-snug" style={{ color: "#000000" }}>{n.title}</h1>
          {n.body && (
            <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: "#000000" }}>{n.body}</p>
          )}
          {n.link && (
            <button type="button" onClick={() => openLink(n.link, navigate)}
              className="self-start mt-1 px-5 py-3 rounded-full text-sm font-bold text-white active:opacity-85"
              style={{ backgroundColor: "var(--teal-deep)" }}>
              {n.link.external ? "Open website" : "Read more"}
            </button>
          )}
        </article>
      )}
    </MobileShell>
  );
}

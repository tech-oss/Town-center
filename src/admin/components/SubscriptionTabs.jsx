import { Link } from "react-router-dom";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";

export default function SubscriptionTabs({ id, active }) {
  const tabs = [
    { key: "subscription", label: "Subscription", to: `/admin/subscriptions/${id}` },
    { key: "documents", label: "Documents", to: `/admin/subscriptions/${id}/documents` },
  ];
  return (
    <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
      {tabs.map((t) => (
        <Link key={t.key} to={t.to}
          className="px-5 py-2.5 text-sm font-medium transition-all"
          style={{ color: active === t.key ? BLUE : MUTED, borderBottom: active === t.key ? `2px solid ${BLUE}` : "2px solid transparent", marginBottom: -1 }}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

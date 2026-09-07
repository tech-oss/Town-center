import { Link } from "react-router-dom";
import { BLUE, BORDER, MUTED, NAVY } from "../theme";

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

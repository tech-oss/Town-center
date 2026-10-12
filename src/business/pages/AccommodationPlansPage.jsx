import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { CARD, BORDER, MUTED, FOREST, SAGE } from "../components/FormKit";
import { listTiers, getSlotUsage } from "../api/accommodation";

// Accommodation plans: Free (1 property) and 5 / 10 / 15 / 20 / 30
// properties. Prices come from accommodation_plan_tiers, so they can change
// without a release. Online checkout for these plans arrives with billing
// (Phase 4); until then a company changes plan through Support.

// "£49", "£1,290", "£29.99".
const money = (n) => `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;

export default function AccommodationPlansPage() {
  const { user } = useBusinessAuth();
  const [tiers, setTiers] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    listTiers().then(setTiers).catch(() => setTiers([]));
    getSlotUsage(user.id).then(setUsage).catch(() => {});
  }, [user.id]);

  const current = user.plan === "premium" ? user.siteTierKey : "acc-free";

  return (
    <BusinessLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Accommodation plans</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Start free with one basic property. Upgrade for the full property profile, or to list more properties. The most a company can have live is 30.
          </p>
        </div>

        {usage && (
          <p className="text-sm" style={{ color: FOREST }}>You're using <strong>{usage.used} of {usage.limit}</strong> property {usage.limit === 1 ? "slot" : "slots"}.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tiers ?? []).map((t) => {
            const isCurrent = t.key === current;
            const free = t.key === "acc-free";
            return (
              <div key={t.key} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ ...CARD, border: isCurrent ? `2px solid ${SAGE}` : CARD.border }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-bold" style={{ color: FOREST }}>{t.name}</p>
                  {isCurrent && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SAGE }}>Current</span>}
                </div>
                <p className="text-2xl font-bold" style={{ color: FOREST }}>
                  {free ? "£0" : money(t.monthly_price)}<span className="text-xs font-semibold" style={{ color: MUTED }}>{free ? "" : " / month"}</span>
                </p>
                {!free && <p className="text-xs -mt-2" style={{ color: MUTED }}>or {money(t.yearly_price)} / year</p>}
                <ul className="flex flex-col gap-1.5 text-xs" style={{ color: MUTED }}>
                  <li>✓ {free ? "1 property" : `Up to ${t.max_properties} properties`}</li>
                  <li>✓ {free ? "Name, address, map pin and company details" : "Full property profiles: header + 12 photos, amenities, rooms, booking, FAQs and reviews"}</li>
                  <li>✓ {t.article_allowance ? `${t.article_allowance} articles included` : "No articles included"}</li>
                  {!free && <li>✓ Property and company-wide analytics</li>}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl p-5 flex items-center gap-4 flex-wrap" style={{ ...CARD, border: `1.5px dashed ${BORDER}` }}>
          <p className="text-sm flex-1 min-w-[240px]" style={{ color: FOREST }}>
            Online sign-up for accommodation plans is being set up. To change your plan now, contact the Maidenhead team and we'll arrange it for you.
          </p>
          <Link to="/business/support" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>Contact support</Link>
        </div>
      </div>
    </BusinessLayout>
  );
}

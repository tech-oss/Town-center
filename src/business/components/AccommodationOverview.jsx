import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CARD, MUTED, FOREST, SAGE } from "./FormKit";
import { listProperties, getSlotUsage, getCompanyProfile } from "../api/accommodation";
import { PROPERTY_STATES, STATE_ORDER } from "../../Data/accommodation";

// The dashboard's summary for an accommodation company: slots used, how many
// properties are in each state, and anything waiting on the company.
export default function AccommodationOverview({ companyId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listProperties(companyId), getSlotUsage(companyId), getCompanyProfile(companyId)])
      .then(([list, usage, profile]) => { if (!cancelled) setData({ list, usage, profile }); })
      .catch(() => { if (!cancelled) setData({ list: [], usage: null, profile: null }); });
    return () => { cancelled = true; };
  }, [companyId]);

  if (!data) return null;
  const counts = data.list.reduce((acc, p) => ({ ...acc, [p.state]: (acc[p.state] ?? 0) + 1 }), {});
  const needsAction = (counts.rejected ?? 0) + (counts.draft ?? 0);
  const noProfile = !data.profile?.exists;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: FOREST }}>Your properties</p>
          {data.usage && (
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{data.usage.used} of {data.usage.limit} property {data.usage.limit === 1 ? "slot" : "slots"} used</p>
          )}
        </div>
        <Link to="/business/properties" className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: SAGE }}>Manage properties</Link>
      </div>

      {data.list.length === 0 ? (
        <p className="text-sm" style={{ color: MUTED }}>You haven't added a property yet. <Link to="/business/properties" className="font-semibold" style={{ color: SAGE }}>Add your first property →</Link></p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {STATE_ORDER.filter((s) => counts[s]).map((s) => (
            <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ color: PROPERTY_STATES[s].color, backgroundColor: PROPERTY_STATES[s].bg }}>
              {counts[s]} {PROPERTY_STATES[s].label.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {(needsAction > 0 || noProfile) && (
        <ul className="flex flex-col gap-1">
          {noProfile && (
            <li><Link to="/business/company" className="text-xs font-medium" style={{ color: "#2563EB" }}>→ Set up your company profile (shown as Managed by on every property)</Link></li>
          )}
          {counts.rejected > 0 && (
            <li><Link to="/business/properties" className="text-xs font-medium" style={{ color: "#B91C1C" }}>→ {counts.rejected} {counts.rejected === 1 ? "property needs" : "properties need"} correcting and resubmitting</Link></li>
          )}
          {counts.draft > 0 && (
            <li><Link to="/business/properties" className="text-xs font-medium" style={{ color: "#2563EB" }}>→ {counts.draft} draft {counts.draft === 1 ? "property" : "properties"} not submitted yet</Link></li>
          )}
        </ul>
      )}
    </div>
  );
}

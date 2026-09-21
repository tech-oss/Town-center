import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatUKDateTime } from "../../lib/ukDateTime";
import { CARD, FOREST, SAGE, MUTED, BORDER } from "./FormKit";
import {
  listPurchaseRequests, resolvePurchaseRequest, requestLabel, requestDestination,
} from "../api/purchaseRequests";

// What the content manager has asked the owner to buy. Shown on the owner's
// dashboard — a Content Manager can write and edit everything the business
// has paid for, but not buy, so this is how the two meet.
export default function PurchaseRequests({ businessId, onToast }) {
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    listPurchaseRequests(businessId).then(setRequests).catch(() => {});
  }, [businessId]);

  useEffect(load, [load]);

  async function resolve(r, status) {
    setBusy(r.id);
    try {
      await resolvePurchaseRequest(r.id, status);
      setRequests((prev) => prev.filter((x) => x.id !== r.id));
      if (status === "dismissed") onToast?.("Request dismissed.");
    } catch (e) {
      onToast?.(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (!requests.length) return null;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold" style={{ color: FOREST }}>Requests from your team</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }}>
          {requests.length}
        </span>
      </div>

      {requests.map((r) => (
        <div key={r.id} className="rounded-xl px-4 py-3 flex flex-col gap-2" style={{ border: `1.5px solid ${BORDER}` }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: FOREST }}>{requestLabel(r)}</p>
            <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
              {r.requestedName} · {formatUKDateTime(r.createdAt)}
            </p>
          </div>
          {r.note && <p className="text-sm" style={{ color: MUTED }}>“{r.note}”</p>}
          <div className="flex gap-2 flex-wrap">
            <Link to={requestDestination(r)} onClick={() => resolve(r, "purchased")}
              className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ backgroundColor: SAGE }}>
              Buy it
            </Link>
            <button onClick={() => resolve(r, "dismissed")} disabled={busy === r.id}
              className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
              style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
              Not now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getApprovalById, approveItem, rejectItem } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

// ─── Sub-renderers per submission type ───────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : "font-medium"}`} style={{ color: "#1B4332" }}>{value ?? "—"}</span>
    </div>
  );
}

function ChangesTable({ changes }) {
  const changed = changes.filter((c) => c.changed);
  const unchanged = changes.filter((c) => !c.changed);
  return (
    <div className="flex flex-col gap-2">
      {changed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(217,119,6,0.3)" }}>
          <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
            Changed fields ({changed.length})
          </div>
          {changed.map((c) => (
            <div key={c.field} className="px-4 py-3 grid grid-cols-3 gap-4 items-start" style={{ borderTop: "1px solid rgba(217,119,6,0.15)" }}>
              <span className="text-xs font-semibold" style={{ color: "#374151" }}>{c.field}</span>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Before</span>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.07)", color: "#991B1B" }}>{c.before}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>After</span>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(45,106,79,0.1)", color: "#1B4332" }}>{c.after}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {unchanged.length > 0 && (
        <details>
          <summary className="text-xs font-semibold cursor-pointer select-none" style={{ color: "#9CA3AF" }}>
            {unchanged.length} unchanged field{unchanged.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(27,67,50,0.1)" }}>
            {unchanged.map((c, i) => (
              <div key={c.field} className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: i > 0 ? "1px solid rgba(27,67,50,0.07)" : "none" }}>
                <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{c.field}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{c.after}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ListingEditDetail({ detail }) {
  return (
    <>
      <Section title="Current listing snapshot">
        <div className="flex gap-4 items-start">
          {detail.currentListing?.image && (
            <img src={detail.currentListing.image} alt="" className="w-24 h-20 rounded-xl object-cover shrink-0" />
          )}
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Field label="Business" value={detail.currentListing?.name} />
            <Field label="Section / Category" value={`${detail.section} › ${detail.category}`} />
            <Field label="Address" value={detail.currentListing?.address} />
            <Field label="Phone" value={detail.currentListing?.phone} />
          </div>
        </div>
      </Section>
      <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
      <Section title="Proposed changes">
        <ChangesTable changes={detail.changes} />
      </Section>
      {detail.newImages?.length > 0 && (
        <>
          <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
          <Section title="New images submitted">
            <div className="flex gap-3 flex-wrap">
              {detail.newImages.map((src, i) => (
                <img key={i} src={src} alt={`New image ${i + 1}`} className="w-32 h-24 rounded-xl object-cover" style={{ border: "2px solid rgba(45,106,79,0.2)" }} />
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function NewListingDetail({ detail }) {
  const { listing } = detail;
  return (
    <>
      <Section title="Submitted listing details">
        <div className="flex gap-4 items-start">
          {listing.image && <img src={listing.image} alt="" className="w-28 h-24 rounded-xl object-cover shrink-0" />}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <Field label="Business name" value={listing.name} />
            <Field label="Section / Category" value={`${detail.section} › ${detail.category}`} />
            <Field label="Address" value={listing.address} />
            <Field label="Phone" value={listing.phone} />
            <Field label="Website" value={listing.website} />
            <Field label="Email" value={listing.email} />
            <Field label="Requested tier" value={listing.tier} />
            <Field label="Hours" value={listing.hours} />
          </div>
        </div>
      </Section>
      <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
      <Section title="Description">
        <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{listing.description}</p>
      </Section>
      {listing.tags?.length > 0 && (
        <>
          <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
          <Section title="Tags / attributes">
            <div className="flex gap-2 flex-wrap">
              {listing.tags.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(27,67,50,0.08)", color: "#1B4332" }}>{t}</span>
              ))}
            </div>
          </Section>
        </>
      )}
      {listing.gallery?.length > 0 && (
        <>
          <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
          <Section title="Gallery images submitted">
            <div className="flex gap-3 flex-wrap">
              {listing.gallery.map((src, i) => (
                <img key={i} src={src} alt="" className="w-32 h-24 rounded-xl object-cover" style={{ border: "1.5px solid rgba(27,67,50,0.12)" }} />
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function OfferDetail({ detail }) {
  const { offer, currentListing } = detail;
  return (
    <>
      <Section title="Current listing">
        <div className="flex gap-4 items-center">
          {currentListing?.image && <img src={currentListing.image} alt="" className="w-16 h-14 rounded-xl object-cover shrink-0" />}
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Field label="Business" value={currentListing?.name} />
            <Field label="Address" value={currentListing?.address} />
          </div>
        </div>
      </Section>
      <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
      <Section title="Offer details">
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: "rgba(27,67,50,0.04)", border: "1.5px solid rgba(27,67,50,0.1)" }}>
          <div>
            <p className="text-lg font-bold" style={{ color: "#1B4332" }}>{offer.title}</p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{offer.headline}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount" value={offer.discount} />
            <Field label="Promo Code" value={offer.code} mono />
            <Field label="Valid From" value={offer.validFrom} />
            <Field label="Valid Until" value={offer.validUntil} />
            <Field label="Days" value={offer.days} />
            <Field label="Time" value={offer.time} />
          </div>
          <Field label="Description" value={offer.description} />
          <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
            <span className="font-semibold">Conditions: </span>{offer.conditions}
          </div>
        </div>
      </Section>
      {offer.image && (
        <>
          <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
          <Section title="Offer image">
            <img src={offer.image} alt="" className="w-48 h-36 rounded-xl object-cover" style={{ border: "1.5px solid rgba(27,67,50,0.12)" }} />
          </Section>
        </>
      )}
    </>
  );
}

function PropertyImportDetail({ detail }) {
  return (
    <>
      <Section title="Feed information">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Feed name" value={detail.feedName} />
          <Field label="Sync time" value={new Date(detail.syncedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} />
          <Field label="Feed URL" value={detail.feedUrl} mono />
          <Field label="Properties imported" value={`${detail.imported} listings`} />
        </div>
      </Section>
      <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />
      <Section title={`Imported properties (${detail.properties.length})`}>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(27,67,50,0.1)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(27,67,50,0.05)", borderBottom: "1px solid rgba(27,67,50,0.1)" }}>
                {["Ref", "Address", "Type", "Beds", "Price", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: "#2D6A4F" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.properties.map((p, i) => (
                <tr key={p.id} style={{ borderTop: i > 0 ? "1px solid rgba(27,67,50,0.07)" : "none" }}>
                  <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "#9CA3AF" }}>{p.id}</td>
                  <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "#1B4332" }}>{p.address}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "#374151" }}>{p.type}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "#374151" }}>{p.beds}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "#1B4332" }}>{p.price}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "For Sale" ? "rgba(27,67,50,0.1)" : "rgba(59,130,246,0.1)", color: p.status === "For Sale" ? "#1B4332" : "#1D4ED8" }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Auto-published — these listings went live immediately per the feed agreement. No approval action is required.</p>
      </Section>
    </>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────

const TYPE_ICON = {
  "Listing Edit": "✎",
  "New Listing": "＋",
  "Offer / Promotion": "🏷",
  "Property Import": "⚡",
};

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, loading } = useFetch(() => getApprovalById(id), [id]);
  const [localStatus, setLocalStatus] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState(null);

  if (loading) return <LoadingState />;
  if (!item) return <EmptyState title="Submission not found" message="This approval item may have been removed." />;

  const status = localStatus ?? item.status;
  const isPending = status === "Pending";

  function handleApprove() {
    approveItem(id).then(() => {
      setLocalStatus("Approved");
      setMessage("Approved — the submission is now live.");
      setRejecting(false);
    });
  }

  function handleReject() {
    if (!reason.trim()) return;
    rejectItem(id, reason).then(() => {
      setLocalStatus("Rejected");
      setMessage(`Rejected — reason recorded: "${reason}"`);
      setRejecting(false);
    });
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/approvals" className="font-medium transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>← Approval Queue</Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
              {TYPE_ICON[item.type] ?? "📄"}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1B4332" }}>{item.business}</h1>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                {item.type} · Submitted by <span className="font-medium" style={{ color: "#374151" }}>{item.submittedBy}</span>
                {" · "}{new Date(item.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {item.source === "xml" && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#1D4ED8" }}>XML Import</span>
            )}
            <StatusTag status={status} />
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(27,67,50,0.04)", color: "#374151" }}>
          <span className="font-semibold" style={{ color: "#1B4332" }}>Summary: </span>{item.summary}
        </div>

        {/* Outcome message */}
        {message && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: status === "Approved" ? "rgba(45,106,79,0.1)" : "rgba(185,28,28,0.07)", color: status === "Approved" ? "#1B4332" : "#991B1B" }}>
            {message}
          </div>
        )}

        {/* Rejection note if already rejected */}
        {status === "Rejected" && item.rejectionReason && !message && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(185,28,28,0.07)", color: "#991B1B" }}>
            <span className="font-semibold">Rejection reason: </span>{item.rejectionReason}
          </div>
        )}

        {/* Action bar */}
        {item.source !== "xml" && isPending && (
          <div className="flex flex-col gap-3 pt-1">
            {!rejecting ? (
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleApprove} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>
                  ✓ Approve submission
                </button>
                <button onClick={() => setRejecting(true)} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.4)" }}>
                  ✕ Reject submission
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: "#6B7280" }}>Rejection reason (required — shown to the business)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain clearly why this submission is being rejected…"
                  className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none"
                  style={{ border: "1.5px solid rgba(185,28,28,0.35)", color: "#1B4332", backgroundColor: "#fff" }}
                />
                <div className="flex gap-2">
                  <button onClick={handleReject} disabled={!reason.trim()} className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: "#991B1B" }}>
                    Confirm rejection
                  </button>
                  <button onClick={() => { setRejecting(false); setReason(""); }} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {item.source === "xml" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span className="text-sm" style={{ color: "#1D4ED8" }}>⚡ Auto-published via XML feed — no manual approval action is required.</span>
          </div>
        )}
      </div>

      {/* Content detail card */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Submission Content</h2>
        {(item.type === "Listing Edit") && <ListingEditDetail detail={item.detail} />}
        {(item.type === "New Listing") && <NewListingDetail detail={item.detail} />}
        {(item.type === "Offer / Promotion") && <OfferDetail detail={item.detail} />}
        {(item.type === "Property Import") && <PropertyImportDetail detail={item.detail} />}
      </div>

      {/* Bottom action repeat for long pages */}
      {item.source !== "xml" && isPending && (
        <div className="flex gap-3 pb-8">
          <button onClick={handleApprove} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>
            ✓ Approve
          </button>
          <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setRejecting(true); }} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.4)" }}>
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  );
}

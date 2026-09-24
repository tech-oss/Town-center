import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FOREST, SAGE, MUTED, BORDER, CARD, Field, Inp, TextArea, SingleImageUpload } from "./FormKit";
import UKDateInput from "./UKDateInput";
import useNow from "../../hooks/useNow";
import { formatUKDateTime, formatCountdown } from "../../lib/ukDateTime";
import {
  SLOT_CONTENT, BOOKING_STATUS,
  getSlotAvailability, getMyBookings, getMyContentOptions,
  chooseBookingContent, saveBookingPost, startSlotCheckout, releaseHold, waitForBookingPaid,
} from "../api/homepageSlots";

// Homepage Promotions — the paid homepage slots (In the Spotlight, Featured
// Article, What's On, Featured Business). Each card shows the price, what on
// the homepage ends soonest, and the slot this business would get if it books
// now. Booking reserves that slot while the owner pays on Stripe, so nobody
// else can take it; everyone else then sees the next free one.

const REFRESH_MS = 30_000;

const STATUS_TONE = {
  awaiting_content: ["#FFFBEB", "#92400E"],
  pending_approval: ["#EFF6FF", "#1D4ED8"],
  approved: ["#ECFDF5", "#047857"],
  rejected: ["#FEF2F2", "#991B1B"],
};

function Countdown({ to, prefix }) {
  const now = useNow();
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return null;
  return <span className="tabular-nums">{prefix} {formatCountdown(ms)}</span>;
}

function BookingTimer({ startsAt, endsAt }) {
  const now = useNow();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const label = now >= end ? "Finished" : now >= start ? `Ends in ${formatCountdown(end - now)}` : `Starts in ${formatCountdown(start - now)}`;
  const live = now >= start && now < end;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
      <span className="text-xs tabular-nums" style={{ color: MUTED }}>
        {formatUKDateTime(startsAt)} → {formatUKDateTime(endsAt)} UK
      </span>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
        style={live ? { backgroundColor: "#DCFCE7", color: "#15803D" } : { backgroundColor: "#F1F5F9", color: "#475569" }}>
        ⏱ {label}
      </span>
    </div>
  );
}

// ─── One slot type ─────────────────────────────────────────────────────────
function SlotCard({ slot, hasContent, premium, busy, onBook, activeBooking }) {
  const now = useNow(15_000);
  const needs = SLOT_CONTENT[slot.slotType];
  const packages = slot.packages ?? [];
  // The cheapest package leads, and is what's selected until they choose.
  const [picked, setPicked] = useState(() => packages[0]?.id ?? null);
  const chosen = packages.find((p) => p.id === picked) ?? packages[0] ?? null;
  const startsNow = chosen?.nextStart && new Date(chosen.nextStart).getTime() <= now + 60_000;
  const full = slot.liveCount >= slot.capacity;
  // Posts can be chosen or written after paying; an event or a Featured
  // Article must already exist.
  const needsContent = needs.kind !== "business_article" && needs.kind !== "business" && !hasContent;

  let blocker = null;
  // Needs the plan, rather than needs a post written.
  let needsPlan = false;
  // One Featured Business booking at a time.
  if (activeBooking) blocker = `Your business is already featured until ${formatUKDateTime(activeBooking.endsAt)}. You can book again after that.`;
  else if (!slot.bookable) blocker = "Not available to book right now.";
  else if (!packages.length) blocker = "No packages on sale for this slot yet.";
  else if (!premium) {
    // Every homepage promotion is a Visibility Plan feature. This used to be
    // checked only on the two slots that need a piece of content first, so In
    // the Spotlight and Featured Business were offered to free businesses —
    // and Featured Business is the worst of the two to sell them, because a
    // free listing's page shows no description, logo, hours or photos.
    needsPlan = true;
    blocker = slot.slotType === "featured_business"
      ? "Needs the Visibility Plan — being featured sends people to your page, and a free listing's page has no description, photos or opening hours yet."
      : `Needs the Visibility Plan: ${slot.label} is a paid promotion.`;
  }
  else if (!chosen?.nextStart) blocker = "Fully booked — check back soon.";
  else if (needsContent) blocker = `Publish ${/^[aeiou]/i.test(needs.noun) ? "an" : "a"} ${needs.noun} first — that's what this slot shows.`;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <div>
        <p className="text-base font-bold" style={{ color: FOREST }}>{slot.label}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{slot.description}</p>
      </div>

      {packages.length > 0 && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={`${slot.label} packages`}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Choose a package</p>
          {packages.map((pkg) => {
            const on = pkg.id === chosen?.id;
            return (
              <button key={pkg.id} type="button" role="radio" aria-checked={on} onClick={() => setPicked(pkg.id)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                style={{ border: `1.5px solid ${on ? SAGE : BORDER}`, backgroundColor: on ? "#F0FDF4" : "#fff" }}>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ border: `2px solid ${on ? SAGE : BORDER}`, backgroundColor: on ? SAGE : "transparent" }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ color: FOREST }}>{pkg.name}</span>
                  <span className="block text-[11px]" style={{ color: MUTED }}>{pkg.durationDays} day{pkg.durationDays === 1 ? "" : "s"} on the homepage</span>
                </span>
                <span className="text-base font-extrabold shrink-0" style={{ color: FOREST }}>£{pkg.price.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl p-3 flex flex-col gap-1.5 text-xs" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
        <p style={{ color: FOREST }}>
          <span className="font-semibold">On now:</span> {slot.liveCount} of {slot.capacity} slots{full ? " (full)" : ""}
        </p>
        {slot.soonestEndingAt ? (
          <p style={{ color: FOREST }}>
            <span className="font-semibold">Ends soonest:</span>{" "}
            {slot.soonestEnding ? `“${slot.soonestEnding}” · ` : ""}
            <span className="tabular-nums">{formatUKDateTime(slot.soonestEndingAt)}</span>{" "}
            <span style={{ color: MUTED }}>(<Countdown to={slot.soonestEndingAt} prefix="in" />)</span>
          </p>
        ) : (
          <p style={{ color: MUTED }}>Nothing is running in this slot right now.</p>
        )}
      </div>

      {chosen?.nextStart && !activeBooking && (
        <div className="rounded-xl p-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#1D4ED8" }}>Your slot if you book now</p>
          <p className="text-sm font-semibold mt-1 tabular-nums" style={{ color: FOREST }}>
            {startsNow ? "Now (shows once approved)" : formatUKDateTime(chosen.nextStart)} → {formatUKDateTime(chosen.nextEnd)}
          </p>
          {!startsNow && (
            <p className="text-xs mt-0.5" style={{ color: "#1D4ED8" }}>
              <Countdown to={chosen.nextStart} prefix="Starts in" /> · UK time
            </p>
          )}
        </div>
      )}

      {blocker ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: "#92400E" }}>{blocker}</p>
          {needsPlan ? (
            <Link to="/business/upgrade" className="text-xs font-semibold" style={{ color: SAGE }}>
              See the Visibility Plan →
            </Link>
          ) : slot.bookable && chosen?.nextStart && needsContent ? (
            <Link to={needs.manage} className="text-xs font-semibold" style={{ color: SAGE }}>
              Go to {needs.kind === "business_event" ? "Events" : "Featured Articles"} →
            </Link>
          ) : null}
        </div>
      ) : (
        <button onClick={() => onBook(slot, chosen)} disabled={busy}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: SAGE }}>
          {busy ? "Reserving your slot…" : `Book for £${chosen.price.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}

// ─── Writing a post for a booking (any plan) ───────────────────────────────
const BLANK_POST = { type: "news", title: "", excerpt: "", body: "", image: "", startDate: "", endDate: "" };

function PostForm({ booking, businessId, onSave }) {
  const [post, setPost] = useState(() => ({ ...BLANK_POST, ...(booking.post ?? {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setPost((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!post.title.trim() || !post.excerpt.trim()) { setError("Add a title and a short summary."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(booking, post);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl p-4" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
      <div className="flex gap-2" role="radiogroup" aria-label="Post type">
        {["news", "offer"].map((t) => (
          <button key={t} type="button" role="radio" aria-checked={post.type === t} onClick={() => set("type", t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={post.type === t ? { backgroundColor: SAGE, color: "#fff" } : { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
            {t === "news" ? "News" : "Offer"}
          </button>
        ))}
      </div>
      <Field label="Title" required>
        <Inp value={post.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 20% off Sunday lunch this month" />
      </Field>
      <Field label="Short summary" required hint="Shown on the homepage card (up to 300 characters)">
        <TextArea rows={2} value={post.excerpt} maxLength={300} onChange={(e) => set("excerpt", e.target.value)} />
      </Field>
      <Field label="Full details" hint="Shown when people open the post">
        <TextArea rows={5} value={post.body} maxLength={5000} onChange={(e) => set("body", e.target.value)} />
      </Field>
      <SingleImageUpload label="Picture" src={post.image} aspect="aspect-[16/9]" pathPrefix={businessId} ratio={16 / 9} ratioLabel="16:9 (Landscape)" onChange={(v) => set("image", v ?? "")} />
      {post.type === "offer" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Offer starts" hint="Optional"><UKDateInput value={post.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
          <Field label="Offer ends" hint="Optional"><UKDateInput value={post.endDate} min={post.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} /></Field>
        </div>
      )}
      {booking.post?.published && (
        <p className="text-[11px]" style={{ color: "#92400E" }}>This post is live. Saving changes sends a new version for approval.</p>
      )}
      {error && <p role="alert" className="text-xs" style={{ color: "#991B1B" }}>{error}</p>}
      <div>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
          {saving ? "Sending…" : "Send for approval"}
        </button>
      </div>
    </div>
  );
}

// ─── One of this business's bookings ───────────────────────────────────────
function BookingRow({ booking: b, label, options, premium, businessId, onChoose, onSavePost }) {
  const needs = SLOT_CONTENT[b.slotType];
  const isPostSlot = needs.kind === "business_article";
  // Visibility Plan businesses can pick one of their posts; anyone can write one.
  const canPick = !isPostSlot || (premium && options.length > 0);
  const [mode, setMode] = useState(() => (isPostSlot && (b.contentKind === "news_offer" || !canPick) ? "write" : "choose"));
  const [choice, setChoice] = useState(b.contentKind === needs.kind ? (b.contentId ?? "") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const finished = new Date(b.endsAt) <= new Date();
  const editable = !finished && needs.kind !== "business" && ["awaiting_content", "pending_approval", "rejected", "approved"].includes(b.status);
  const [bg, fg] = STATUS_TONE[b.status] ?? ["#F1F5F9", "#475569"];

  async function save() {
    if (!choice) return;
    setSaving(true);
    setError("");
    try {
      await onChoose(b, needs.kind, choice);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ border: `1px solid ${BORDER}`, opacity: finished ? 0.65 : 1 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-bold" style={{ color: FOREST }}>{label}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: bg, color: fg }}>
          {finished ? "Finished" : BOOKING_STATUS[b.status] ?? b.status}
        </span>
        {b.amount != null && <span className="text-xs" style={{ color: MUTED }}>Paid £{b.amount.toFixed(2)}</span>}
      </div>
      {b.contentTitle && <p className="text-sm" style={{ color: FOREST }}>Showing: “{b.contentTitle}”</p>}
      <BookingTimer startsAt={b.startsAt} endsAt={b.endsAt} />
      {b.status === "rejected" && (
        <p className="text-xs" style={{ color: "#991B1B" }}>
          Not approved{b.rejectionReason ? `: ${b.rejectionReason}` : ""}. Change it below and send it again.
        </p>
      )}
      {b.status === "awaiting_content" && !finished && (
        <p className="text-xs" style={{ color: "#92400E" }}>
          Your slot is reserved. {isPostSlot
            ? (premium ? "Choose one of your News & Offers posts or write a new one" : "Write the post you'd like to show")
            : `Choose which ${needs.noun} to show`} — admin approves it before it goes on the homepage. The slot runs on its dates either way.
        </p>
      )}

      {editable && isPostSlot && (
        <div className="flex gap-2 mt-1" role="tablist">
          {canPick && (
            <button type="button" role="tab" aria-selected={mode === "choose"} onClick={() => setMode("choose")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={mode === "choose" ? { backgroundColor: FOREST, color: "#fff" } : { border: `1.5px solid ${BORDER}`, color: FOREST }}>
              Choose one of my posts
            </button>
          )}
          <button type="button" role="tab" aria-selected={mode === "write"} onClick={() => setMode("write")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={mode === "write" ? { backgroundColor: FOREST, color: "#fff" } : { border: `1.5px solid ${BORDER}`, color: FOREST }}>
            {b.contentKind === "news_offer" ? "Edit my post" : "Write a new post"}
          </button>
        </div>
      )}

      {editable && mode === "write" && isPostSlot && (
        <PostForm booking={b} businessId={businessId} onSave={onSavePost} />
      )}

      {editable && mode === "choose" && canPick && (
        <div className="flex gap-2 flex-wrap items-center">
          <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label={`Choose a ${needs.noun}`}
            className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
            <option value="">Choose a {needs.noun}…</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.title}{o.detail ? ` · ${o.detail}` : ""}</option>)}
          </select>
          <button onClick={save} disabled={saving || !choice || (b.contentKind === needs.kind && choice === b.contentId)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
            {saving ? "Sending…" : b.contentId ? "Change" : "Send for approval"}
          </button>
          {b.status === "approved" && choice && choice !== b.contentId && (
            <p className="w-full text-[11px]" style={{ color: "#92400E" }}>Changing it sends your slot back for approval.</p>
          )}
          {isPostSlot && (
            <p className="w-full text-[11px]" style={{ color: MUTED }}>
              A post that's still waiting for approval is approved together with your slot.
            </p>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-xs" style={{ color: "#991B1B" }}>{error}</p>}
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────
export default function HomepagePromotions({ businessId, premium, onToast, onBooked }) {
  const [params, setParams] = useSearchParams();
  const [slots, setSlots] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [options, setOptions] = useState({ spotlight: [], whats_on: [], featured_article: [] });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null); // "waiting" | "late"

  const refresh = useCallback(async () => {
    try {
      const [s, b, articles, events] = await Promise.all([
        getSlotAvailability(businessId),
        getMyBookings(businessId),
        getMyContentOptions(businessId, "spotlight").catch(() => []),
        getMyContentOptions(businessId, "whats_on").catch(() => []),
      ]);
      const featured = await getMyContentOptions(businessId, "featured_article").catch(() => []);
      setSlots(s);
      setBookings(b);
      setOptions({ spotlight: articles, whats_on: events, featured_article: featured });
    } catch (e) {
      setError(e.message);
    }
  }, [businessId]);

  // Availability changes as other businesses book, so keep it current.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  // Back from Stripe.
  useEffect(() => {
    const outcome = params.get("promotion");
    const placement = params.get("placement");
    const sessionId = params.get("session_id");
    if (!outcome) return;
    setParams({}, { replace: true });
    if (outcome === "cancelled" && placement) {
      releaseHold(placement).finally(refresh);
      onToast("Checkout cancelled — you haven't been charged and the slot has been released.");
    }
    if (outcome === "success" && placement) {
      setConfirming("waiting");
      waitForBookingPaid(placement, sessionId).then((booking) => {
        refresh();
        if (booking) {
          setConfirming(null);
          onBooked?.();
          onToast(booking.slotType === "featured_business"
            ? "Booked! Your Featured Business slot is waiting for admin approval."
            : "Booked! Now choose what to show in your slot below.");
        } else {
          setConfirming("late");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function book(slot, pkg) {
    setBusy(slot.slotType);
    setError("");
    try {
      await startSlotCheckout(businessId, slot.slotType, pkg?.id ?? null);
    } catch (e) {
      setError(e.message);
      setBusy(null);
      refresh();
    }
  }

  async function savePost(booking, post) {
    await saveBookingPost(booking.id, post);
    onToast("Post sent for approval. It goes on the homepage once admin approves it.");
    refresh();
  }

  async function choose(booking, kind, contentId) {
    await chooseBookingContent(booking.id, kind, contentId);
    onToast("Sent for approval. We'll let you know when it's approved.");
    refresh();
  }

  const labelFor = (key) => slots?.find((s) => s.slotType === key)?.label ?? "Homepage slot";
  const contentFor = (key) => {
    if (SLOT_CONTENT[key].kind === "business_event") return options.whats_on;
    if (SLOT_CONTENT[key].kind === "feature_article") return options.featured_article;
    return options.spotlight;
  };
  const active = bookings.filter((b) => new Date(b.endsAt) > new Date());
  const past = bookings.filter((b) => new Date(b.endsAt) <= new Date());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-lg font-bold" style={{ color: FOREST }}>Homepage Promotions</p>
        <p className="text-sm mt-0.5" style={{ color: MUTED }}>
          Pay once to appear on the Maidenhead homepage and app for a set time. Everything you promote also stays on the Offers page. All times are UK time.
        </p>
      </div>

      {confirming && (
        <div role="status" className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{ backgroundColor: confirming === "late" ? "#FFFBEB" : "#EFF6FF", color: confirming === "late" ? "#92400E" : "#1D4ED8" }}>
          {confirming === "waiting" ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: "#BFDBFE", borderTopColor: "#1D4ED8" }} />
              Confirming your payment with Stripe…
            </>
          ) : (
            <>
              Stripe hasn't confirmed your payment yet — this usually takes a few seconds. You won't be charged twice.
              <button onClick={() => { setConfirming(null); refresh(); }} className="ml-auto font-semibold underline">Refresh</button>
            </>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{error}</p>}

      {active.length > 0 && (
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>Your bookings</p>
          {active.map((b) => (
            <BookingRow key={b.id} booking={b} label={labelFor(b.slotType)} options={contentFor(b.slotType)} premium={premium} businessId={businessId} onChoose={choose} onSavePost={savePost} />
          ))}
        </div>
      )}

      {slots === null ? (
        <p className="text-sm" style={{ color: MUTED }}>Loading homepage slots…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {slots.map((slot) => (
            <SlotCard key={slot.slotType} slot={slot} premium={premium}
              hasContent={contentFor(slot.slotType).length > 0}
              busy={busy === slot.slotType} onBook={book}
              activeBooking={slot.slotType === "featured_business"
                ? bookings.find((b) => b.slotType === "featured_business" && b.status !== "cancelled" && new Date(b.endsAt) > new Date())
                : null} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="bg-white rounded-2xl p-5" style={CARD}>
          <summary className="text-sm font-bold cursor-pointer" style={{ color: FOREST }}>Past bookings ({past.length})</summary>
          <div className="flex flex-col gap-3 mt-3">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} label={labelFor(b.slotType)} options={[]} premium={premium} businessId={businessId} onChoose={choose} onSavePost={savePost} />
            ))}
          </div>
        </details>
      )}

      <p className="text-[11px]" style={{ color: MUTED }}>
        Payment is taken securely by Stripe. Your slot is held for you while you pay. Admin checks what you choose before it appears, and may move or swap homepage content if needed.
      </p>
    </div>
  );
}

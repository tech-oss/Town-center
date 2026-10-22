import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import KeepChooser from "../components/KeepChooser";
import ArticleKeepChooser from "../components/ArticleKeepChooser";
import { listArticles } from "../api/businessArticles";
import { CARD, BORDER, MUTED, FOREST, SAGE, Toast, useToast } from "../components/FormKit";
import { listTiers, getSlotUsage, listProperties } from "../api/accommodation";
import {
  startAccommodationCheckout, changeAccommodationPlan, cancelAccommodationPlan, undoAccommodationChange,
  getPlanChange, setPlanChangeKeep, waitForSubscription, getTargetArticleAllowance, setPlanChangeArticles,
} from "../api/accommodationBilling";

// Accommodation plans: Free (1 property) and 5 / 10 / 15 / 20 / 30
// properties, monthly or yearly. Prices come from accommodation_plan_tiers,
// so they can change without a release.
//
//   Free → paid           Stripe Checkout.
//   More properties       At once; Stripe charges the difference.
//   Fewer properties,     At the end of the billing period. If the new plan
//   or monthly ↔ yearly   allows fewer properties than are using a slot, the
//                         owner chooses which stay live; the rest become
//                         inactive then (kept, not deleted).
//   Back to Free          At the end of the period, keeping one property.

// "£49", "£1,290", "£29.99".
const money = (n) => `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "the end of your billing period");
const USING_SLOT = new Set(["live", "pending", "rejected"]);

function Confirm({ title, children, confirmLabel, busy, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }}
      role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4" style={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold" style={{ color: FOREST }}>{title}</h2>
        <div className="text-sm flex flex-col gap-2" style={{ color: "#334155" }}>{children}</div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

async function fetchPage(companyId) {
  const [tiers, usage, change, props, articles] = await Promise.all([
    listTiers(), getSlotUsage(companyId), getPlanChange(companyId), listProperties(companyId),
    listArticles(companyId).catch(() => []),
  ]);
  // How many articles may stay live after a scheduled change.
  const articleLimit = change ? await getTargetArticleAllowance(companyId, change).catch(() => null) : null;
  return {
    tiers, usage, change, articleLimit,
    using: props.filter((p) => USING_SLOT.has(p.state)),
    liveArticles: articles.filter((a) => a.status === "Live"),
  };
}

export default function AccommodationPlansPage() {
  const { user, refresh } = useBusinessAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [interval, setBillingInterval] = useState(user.billingInterval === "year" ? "year" : "month");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // { type: "upgrade" | "downgrade" | "cancel" | "keep" | "articles", tier }
  // Just scheduled a downgrade or cancellation: ask which articles stay, if
  // more are live than the new plan allows.
  const [askArticles, setAskArticles] = useState(false);
  // Back from Stripe Checkout (?checkout=success|cancelled).
  const [outcome] = useState(() => params.get("checkout"));
  const [notice, setNotice] = useState(() => (
    outcome === "cancelled" ? { tone: "info", text: "Checkout was cancelled — nothing has changed." }
      : outcome === "success" ? { tone: "info", text: "Payment received — switching your plan on…" }
      : null
  ));
  const [toast, setToast] = useToast();

  const load = useCallback(() => fetchPage(user.id).then(setData).catch((e) => setError(e.message)), [user.id]);
  // The plan as it is now, not as it was at sign-in: Maidenhead admin may
  // have given a complimentary plan (or changed it) since.
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    fetchPage(user.id).then((d) => { if (!cancelled) setData(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [user.id]);

  // After a successful checkout, wait for the webhook to switch the plan on.
  useEffect(() => {
    if (!outcome) return;
    setParams({}, { replace: true });
    if (outcome !== "success") return;
    // A Stripe subscription, not just "premium": a company on a complimentary
    // plan is premium already.
    waitForSubscription(user.id, (s) => s.plan === "premium" && !!s.stripeSubscriptionId).then(async (sub) => {
      await refresh();
      await load();
      setNotice(sub
        ? { tone: "ok", text: "Your new plan is active. You can add more properties now." }
        : { tone: "info", text: "Your payment went through. Your plan will switch on in a moment — refresh the page if it hasn't." });
    });
  }, [outcome, setParams, user.id, refresh, load]);

  if (error) return <BusinessLayout><p className="text-sm" style={{ color: "#991B1B" }}>Couldn't load plans: {error}</p></BusinessLayout>;
  if (!data) return <BusinessLayout><p className="text-sm" style={{ color: MUTED }}>Loading plans…</p></BusinessLayout>;

  const { tiers, usage, change, using, liveArticles, articleLimit } = data;
  // More articles live than the scheduled plan allows: the owner chooses
  // which stay; the rest are hidden when the change happens.
  const articlesOver = !!change && articleLimit != null && liveArticles.length > articleLimit;
  const articleTitle = (id) => liveArticles.find((a) => a.id === id)?.title ?? "an article";
  const showArticleChooser = articlesOver && (dialog?.type === "articles" || (askArticles && !dialog));
  const paid = user.plan === "premium" && !!user.stripeSubscriptionId;
  // A plan Maidenhead admin gave free of charge: it's the current plan, and
  // the company can still pay for one with more properties (a new Stripe
  // subscription through Checkout), but not for one it already has.
  const complimentary = user.plan === "premium" && !user.stripeSubscriptionId;
  const currentKey = paid || complimentary ? user.siteTierKey : "acc-free";
  const current = tiers.find((t) => t.key === currentKey) ?? tiers.find((t) => t.key === "acc-free");
  const currentInterval = user.billingInterval === "year" ? "year" : "month";
  const tierName = (key) => tiers.find((t) => t.key === key)?.name ?? key;
  const nameOf = (id) => using.find((p) => p.id === id)?.name ?? "a property";

  async function act(fn, success) {
    setBusy(true);
    try {
      const result = await fn();
      setDialog(null);
      if (success) setNotice({ tone: "ok", text: typeof success === "function" ? success(result) : success });
      await refresh();
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  function choose(tier) {
    const free = tier.key === "acc-free";
    if (!paid) {
      if (free) return;
      if (complimentary && tier.max_properties <= (current?.max_properties ?? 1)) return;
      return act(() => startAccommodationCheckout(user.id, tier.key, interval));
    }
    if (free) {
      return setDialog({ type: using.length > 1 ? "cancel-keep" : "cancel", tier });
    }
    if (tier.max_properties > (current?.max_properties ?? 1)) return setDialog({ type: "upgrade", tier });
    return setDialog({ type: using.length > tier.max_properties ? "downgrade-keep" : "downgrade", tier });
  }

  const upgrade = (tier) => act(async () => {
    await changeAccommodationPlan(user.id, tier.key, interval);
    await waitForSubscription(user.id, (s) => s.siteTierKey === tier.key, { timeoutMs: 20000 });
  }, `You're now on ${tier.name}. The difference has been charged to your card.`);
  const downgrade = (tier, keep) => act(
    () => changeAccommodationPlan(user.id, tier.key, interval, keep),
    (r) => `${tier.name} (${interval === "year" ? "yearly" : "monthly"}) starts on ${fmtDate(r.effectiveAt ? new Date(r.effectiveAt * 1000).toISOString() : null)}. You keep your current plan until then.`,
  ).then(() => setAskArticles(true));
  const cancel = (keep) => act(
    () => cancelAccommodationPlan(user.id, keep),
    (r) => `Your plan ends on ${fmtDate(r.effectiveAt ? new Date(r.effectiveAt * 1000).toISOString() : null)}. Then you're on Free with one basic property.`,
  ).then(() => setAskArticles(true));

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Accommodation plans</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Start free with one basic property. Upgrade for full property profiles, or to list more properties. The most a company can have live is 30.
          </p>
        </div>

        {notice && (
          <div role="status" className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
            style={notice.tone === "ok" ? { backgroundColor: "rgba(16,185,129,0.1)", color: "#065F46" } : { backgroundColor: "rgba(37,99,235,0.07)", color: "#1E3A8A" }}>
            <span className="flex-1">{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Current plan */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Current plan</p>
              <p className="text-lg font-bold" style={{ color: FOREST }}>
                {current?.name ?? "Free"}{paid && <span className="text-sm font-semibold" style={{ color: MUTED }}> · {currentInterval === "year" ? "yearly" : "monthly"}</span>}
              </p>
              {complimentary && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: "#047857" }}>
                  Complimentary — given by Maidenhead, no charge. Choose a plan with more properties below to pay for it instead.
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                {usage.used} of {usage.limit} property {usage.limit === 1 ? "slot" : "slots"} used
                {paid && user.renewalDate && !change && ` · renews ${fmtDate(user.renewalDate)}`}
              </p>
            </div>
            {/Failed|Past Due/.test(user.planStatus ?? "") && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>
                Your latest payment didn't go through — update your card in Subscriptions.
              </span>
            )}
          </div>

          {change && (
            <div className="rounded-xl px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)" }}>
              <p className="text-sm" style={{ color: "#92400E" }}>
                {change.change === "cancel"
                  ? <>Your plan ends on <strong>{fmtDate(change.effectiveAt)}</strong>. You'll then be on Free with one basic property</>
                  : <>On <strong>{fmtDate(change.effectiveAt)}</strong> you move to <strong>{tierName(change.targetTier)}</strong>{change.targetInterval ? ` (${change.targetInterval === "year" ? "yearly" : "monthly"})` : ""}</>}
                {change.keep.length > 0 && <> — keeping {change.keep.map(nameOf).join(", ")} live</>}.
                {" "}Anything else using a slot then becomes inactive. Its details are kept, and you can reactivate it after upgrading.
              </p>
              {articlesOver && (
                <p className="text-sm" style={{ color: "#92400E" }}>
                  <strong>Articles:</strong> the new plan allows {articleLimit} live {articleLimit === 1 ? "article" : "articles"} and you have {liveArticles.length}.{" "}
                  {change.keepArticles
                    ? <>Keeping {change.keepArticles.map(articleTitle).join(", ") || "none"} live; the others will be hidden (not deleted).</>
                    : <>Choose which stay live — otherwise the most recently updated stay and the others are hidden (not deleted).</>}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {using.length > (tiers.find((t) => t.key === change.targetTier)?.max_properties ?? 1) && (
                  <button type="button" onClick={() => setDialog({ type: "keep", tier: tiers.find((t) => t.key === change.targetTier) })}
                    className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ color: FOREST, border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
                    Change which properties stay
                  </button>
                )}
                {articlesOver && (
                  <button type="button" onClick={() => setDialog({ type: "articles" })}
                    className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ color: FOREST, border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
                    {change.keepArticles ? "Change which articles stay" : "Choose which articles stay"}
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => act(() => undoAccommodationChange(user.id), "Done — you're staying on your current plan.")}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
                  Keep my current plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Billing interval */}
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Billing">
          {[["month", "Monthly"], ["year", "Yearly"]].map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={interval === v} onClick={() => setBillingInterval(v)}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={interval === v ? { backgroundColor: FOREST, color: "#fff" } : { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((t) => {
            const free = t.key === "acc-free";
            const isCurrent = t.key === currentKey && (free || complimentary || interval === currentInterval);
            const more = t.max_properties > (current?.max_properties ?? 1);
            // Already covered by the complimentary plan (or Free, which only
            // Maidenhead can move them to).
            const included = complimentary && !isCurrent && !more;
            const label = isCurrent ? (complimentary ? "Your complimentary plan" : "Your current plan")
              : included ? (free ? "Ask Maidenhead to change" : "Included in your plan")
              : complimentary ? "Upgrade and pay"
              : !paid ? (free ? "Your current plan" : "Choose this plan")
              : free ? "Switch to Free"
              : more ? "Upgrade now"
              : "Switch at renewal";
            const disabled = isCurrent || included || (!paid && free) || busy || !!change && t.key === change.targetTier;
            return (
              <div key={t.key} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ ...CARD, border: isCurrent ? `2px solid ${SAGE}` : CARD.border }}>
                <p className="text-base font-bold" style={{ color: FOREST }}>{t.name}</p>
                <p className="text-2xl font-bold" style={{ color: FOREST }}>
                  {free ? "£0" : money(interval === "year" ? t.yearly_price : t.monthly_price)}
                  <span className="text-xs font-semibold" style={{ color: MUTED }}>{free ? "" : interval === "year" ? " / year" : " / month"}</span>
                </p>
                <ul className="flex flex-col gap-1.5 text-xs flex-1" style={{ color: MUTED }}>
                  <li>✓ {free ? "1 property" : `Up to ${t.max_properties} properties`}</li>
                  <li>✓ {free ? "Name, address, map pin and company details" : "Full property profiles: header + 12 photos, amenities, rooms, booking, FAQs and reviews"}</li>
                  <li>✓ {t.article_allowance ? `${t.article_allowance} articles included` : "No articles included"}</li>
                  {!free && <li>✓ Property and company-wide analytics</li>}
                </ul>
                <button type="button" onClick={() => choose(t)} disabled={disabled}
                  className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={isCurrent || (!paid && free) ? { color: FOREST, border: `1.5px solid ${BORDER}` } : { color: "#fff", backgroundColor: free ? "#475569" : SAGE }}>
                  {label}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs" style={{ color: MUTED }}>
          Upgrades take effect straight away and Stripe charges the difference for the rest of your billing period. Moving to fewer properties, switching between monthly and yearly, or going back to Free happens at the end of your billing period. Cards and invoices are managed in <Link to="/business/billing" className="font-semibold underline">Subscriptions</Link>.
        </p>
      </div>

      {dialog?.type === "upgrade" && (
        <Confirm title={`Upgrade to ${dialog.tier.name}`} confirmLabel="Upgrade now" busy={busy}
          onConfirm={() => upgrade(dialog.tier)} onCancel={() => setDialog(null)}>
          <p>You can have up to {dialog.tier.max_properties} properties straight away.</p>
          <p>Stripe charges the difference for the rest of this billing period now, then {money(interval === "year" ? dialog.tier.yearly_price : dialog.tier.monthly_price)} {interval === "year" ? "a year" : "a month"}.</p>
        </Confirm>
      )}
      {dialog?.type === "downgrade" && (
        <Confirm title={`Switch to ${dialog.tier.name}`} confirmLabel="Switch at renewal" busy={busy}
          onConfirm={() => downgrade(dialog.tier, using.map((p) => p.id))} onCancel={() => setDialog(null)}>
          <p>You stay on {current?.name} until the end of this billing period, then move to {dialog.tier.name} ({interval === "year" ? "yearly" : "monthly"}).</p>
        </Confirm>
      )}
      {dialog?.type === "downgrade-keep" && (
        <KeepChooser title={`Switch to ${dialog.tier.name}`} limit={dialog.tier.max_properties} properties={using} busy={busy}
          intro={`${dialog.tier.name} allows ${dialog.tier.max_properties} properties. Choose which stay live when it starts at the end of this billing period. The others become inactive then — their details are kept.`}
          confirmLabel="Switch at renewal" onCancel={() => setDialog(null)} onConfirm={(keep) => downgrade(dialog.tier, keep)} />
      )}
      {dialog?.type === "cancel" && (
        <Confirm title="Switch to Free" confirmLabel="Switch to Free at renewal" busy={busy}
          onConfirm={() => cancel(using.map((p) => p.id))} onCancel={() => setDialog(null)}>
          <p>Your plan continues until the end of this billing period. Then you're on Free: one property showing its name, address, map pin and your company details.</p>
          <p>Nothing is deleted. Upgrade again any time to bring back full profiles.</p>
        </Confirm>
      )}
      {dialog?.type === "cancel-keep" && (
        <KeepChooser title="Switch to Free" limit={1} properties={using} busy={busy}
          intro="Free shows one basic property. Choose which one stays live when your plan ends at the end of this billing period. The others become inactive then — their details are kept, and you can reactivate them after upgrading."
          confirmLabel="Switch to Free at renewal" onCancel={() => setDialog(null)} onConfirm={(keep) => cancel(keep)} />
      )}
      {dialog?.type === "keep" && dialog.tier && (
        <KeepChooser title="Which properties stay live" limit={dialog.tier.max_properties} properties={using} initial={change?.keep} busy={busy}
          intro={`From ${fmtDate(change?.effectiveAt)} your plan allows ${dialog.tier.max_properties} ${dialog.tier.max_properties === 1 ? "property" : "properties"}. Choose which stay live.`}
          confirmLabel="Save" onCancel={() => setDialog(null)}
          onConfirm={(keep) => act(() => setPlanChangeKeep(user.id, keep), "Saved — those properties will stay live.")} />
      )}
      {showArticleChooser && (
        <ArticleKeepChooser title="Which articles stay live" limit={articleLimit} articles={liveArticles.map((a) => ({ id: a.id, title: a.title, type: a.type }))}
          initial={change.keepArticles} busy={busy}
          intro={`From ${fmtDate(change.effectiveAt)} your plan allows ${articleLimit} live ${articleLimit === 1 ? "article" : "articles"}. Choose which stay live; the others are hidden then — kept, not deleted — and can be put live again when there's room.`}
          confirmLabel="Save" onCancel={() => { setDialog(null); setAskArticles(false); }}
          onConfirm={(ids) => act(() => setPlanChangeArticles(user.id, ids), "Saved — those articles will stay live.").then(() => setAskArticles(false))} />
      )}
    </BusinessLayout>
  );
}

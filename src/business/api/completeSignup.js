import { createRegisteredBusiness } from "./businessRegistration";
import { createContentManagerRequest, createClaimRequest } from "../hooks/useUserRegistry";
import { pendingSignupOf, clearPendingSignup } from "./pendingSignup";

// Makes what a sign-up was for (pendingSignup.js), now that the person has
// confirmed their email and is signed in. Runs on the page the confirmation
// link opens, and again at log-in in case the link opened elsewhere; either
// way it does the work once and then forgets the saved details.
const MAKERS = {
  business: createRegisteredBusiness,
  content_manager: createContentManagerRequest,
  claim: createClaimRequest,
};

const running = new Map(); // one run per login at a time, in this tab

export function completePendingSignup(user) {
  const pending = pendingSignupOf(user);
  if (!pending) return Promise.resolve({ ok: true, kind: null });
  if (!running.has(user.id)) {
    running.set(user.id, (async () => {
      const make = MAKERS[pending.kind];
      if (!make) return { ok: false, kind: pending.kind, error: "This sign-up couldn't be finished. Please contact hello@maidenhead.com." };
      const res = await make(pending.details ?? {}, user);
      if (res.ok) await clearPendingSignup();
      return { ...res, kind: pending.kind, businessName: pending.details?.businessName ?? null };
    })().finally(() => running.delete(user.id)));
  }
  return running.get(user.id);
}

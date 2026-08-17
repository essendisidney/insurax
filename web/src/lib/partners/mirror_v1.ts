"use client";

import { platformStore } from "@/lib/store";
import type { Claim, Policy, Quote } from "@/lib/types";

/** Upsert partner /api/v1 entities into the demo UI book after playground calls. */
export function mirrorV1Response(data: {
  quote?: Quote;
  policy?: Policy;
  claim?: Claim;
}) {
  if (data.quote) {
    const exists = platformStore.get().quotes.some((q) => q.id === data.quote!.id);
    if (exists) platformStore.updateQuote(data.quote.id, data.quote);
    else platformStore.addQuote(data.quote);
  }
  if (data.policy) {
    const exists = platformStore.get().policies.some((p) => p.id === data.policy!.id);
    if (exists) platformStore.updatePolicy(data.policy.id, data.policy);
    else platformStore.addPolicy(data.policy);
  }
  if (data.claim) {
    const exists = platformStore.get().claims.some((c) => c.id === data.claim!.id);
    if (exists) platformStore.updateClaim(data.claim.id, data.claim);
    else platformStore.addClaim(data.claim);
  }
}

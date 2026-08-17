"use client";

import { issuePolicyCertificate, recordChannelPayment, pushNotification } from "@/lib/events/ledger";
import { platformStore } from "@/lib/store";
import type { ChannelEffect } from "@/lib/channels/ussd";
import type { Claim, Lead } from "@/lib/types";

/** Apply USSD / WhatsApp side-effects into the demo PAS book. */
export function applyChannelEffects(effects: ChannelEffect[] | undefined) {
  if (!effects?.length) return;
  for (const effect of effects) {
    if (effect.type === "payment") {
      recordChannelPayment({
        phone: effect.phone,
        amount: effect.amount,
        policyNumber: effect.policyNumber,
        participantName: effect.participantName,
      });
    }
    if (effect.type === "lead") {
      const lead: Lead = {
        id: `ld-${crypto.randomUUID().slice(0, 8)}`,
        name: effect.name,
        phone: effect.phone,
        productLine: effect.productLine,
        status: "new",
        agentId: "a-1",
        notes: effect.notes,
      };
      platformStore.addLead(lead);
    }
    if (effect.type === "claim") {
      const policies = platformStore.get().policies;
      const policy =
        policies.find((p) => p.number === effect.policyNumber) ??
        policies.find((p) => p.number.includes("BODA")) ??
        policies[0];
      if (!policy) continue;
      const claim: Claim = {
        id: crypto.randomUUID(),
        number: `CLM-USSD-${Math.floor(Math.random() * 90000 + 10000)}`,
        policyId: policy.id,
        policyNumber: policy.number,
        participantId: policy.participantId,
        participantName: policy.participantName,
        status: "reported",
        incidentDate: new Date().toISOString().slice(0, 10),
        reportedAt: new Date().toISOString(),
        description: `${effect.description} (via USSD ${effect.phone})`,
        location: "USSD intake",
        claimed: Math.min(50000, Math.round(policy.sumCovered * 0.1)),
        fraudScore: 25,
        slaDue: new Date(Date.now() + 3 * 86400000).toISOString(),
      };
      platformStore.addClaim(claim);
      pushNotification({
        channel: "sms",
        title: "Claim registered",
        body: `${claim.number} logged for ${policy.number}. An officer will follow up.`,
      });
    }
    if (effect.type === "certificate") {
      const policies = platformStore.get().policies;
      const policy =
        (effect.policyNumber
          ? policies.find((p) => p.number === effect.policyNumber)
          : undefined) ??
        policies.find((p) => p.status === "active") ??
        policies[0];
      if (!policy) continue;
      issuePolicyCertificate(policy);
    }
    if (effect.type === "notify") {
      pushNotification({
        channel: effect.channel === "whatsapp" ? "whatsapp" : "sms",
        title: effect.title,
        body: effect.body,
      });
    }
  }
}

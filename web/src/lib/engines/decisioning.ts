import { scoreClaim } from "./fraud";
import type { Claim, Payment, Policy, Quote } from "../types";

export type Recommendation = {
  id: string;
  module: "Risk" | "Fraud" | "Pay" | "Customer" | "Agent";
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  href: string;
  action?: "accept_quote" | "clear_fraud" | "hold_payout" | "chase_payment";
  subjectId?: string;
};

const CROSS_SELL: Record<string, { line: string; product: string }> = {
  motor: { line: "medical", product: "Hospital Cash Micro" },
  micro: { line: "funeral", product: "Janaaza Cover" },
  medical: { line: "family_takaful", product: "Family Takaful Protect" },
};

export function recommendFromBook(input: {
  quotes: Quote[];
  policies: Policy[];
  claims: Claim[];
  payments: Payment[];
}): Recommendation[] {
  const out: Recommendation[] = [];

  for (const q of input.quotes) {
    if (q.status === "referred" || q.uwDecision === "refer") {
      out.push({
        id: `uw-${q.id}`,
        module: "Risk",
        severity: "high",
        title: `Refer ${q.number}`,
        detail: q.uwNotes || "Straight-through rules asked for an underwriter.",
        href: `/app/quotes/${q.id}`,
        action: "accept_quote",
        subjectId: q.id,
      });
    }
  }

  for (const c of input.claims) {
    const policy = input.policies.find((p) => p.id === c.policyId);
    const scored = policy ? scoreClaim(c, policy, input.claims.filter((h) => h.id !== c.id)) : null;
    const score = scored?.score ?? c.fraudScore;
    if (score >= 60 || c.status === "fraud_check") {
      out.push({
        id: `frd-${c.id}`,
        module: "Fraud",
        severity: "high",
        title: `Investigate ${c.number}`,
        detail: scored?.signals.length
          ? scored.signals.map((s) => s.detail).join(" ")
          : `Fraud score ${score}. Hold payout until cleared.`,
        href: `/app/claims/${c.id}`,
        action: score >= 70 ? "hold_payout" : "clear_fraud",
        subjectId: c.id,
      });
    }
  }

  for (const p of input.policies) {
    const days = daysUntil(p.expiry);
    if ((p.status === "active" || p.status === "pending_payment") && days >= 0 && days <= 30) {
      out.push({
        id: `ren-${p.id}`,
        module: "Customer",
        severity: days <= 7 ? "high" : "medium",
        title: `Renewal save ${p.number}`,
        detail: `${p.productName} expires in ${days} day${days === 1 ? "" : "s"}.`,
        href: `/app/policies/${p.id}`,
      });
    }
    if (p.status === "pending_payment") {
      out.push({
        id: `pay-${p.id}`,
        module: "Pay",
        severity: "medium",
        title: `Collect ${p.number}`,
        detail: "Cover is bound but contribution is still outstanding.",
        href: "/app/payments",
        action: "chase_payment",
        subjectId: p.id,
      });
    }
  }

  const failed = input.payments.filter((p) => p.status === "failed");
  for (const pay of failed.slice(0, 4)) {
    out.push({
      id: `fail-${pay.id}`,
      module: "Pay",
      severity: "medium",
      title: `Retry ${pay.reference}`,
      detail: `${pay.participantName} · collection failed.`,
      href: "/app/payments",
    });
  }

  const byParticipant = new Map<string, Policy[]>();
  for (const p of input.policies.filter((x) => x.status === "active")) {
    const list = byParticipant.get(p.participantId) ?? [];
    list.push(p);
    byParticipant.set(p.participantId, list);
  }
  for (const [participantId, covers] of byParticipant) {
    const lines = new Set(covers.map((c) => c.productName.toLowerCase()));
    for (const cover of covers) {
      const key = Object.keys(CROSS_SELL).find((k) => cover.productName.toLowerCase().includes(k));
      if (!key) continue;
      const next = CROSS_SELL[key];
      if ([...lines].some((n) => n.includes(next.line.replaceAll("_", " ")) || n.includes(next.product.toLowerCase()))) {
        continue;
      }
      out.push({
        id: `xsell-${participantId}-${key}`,
        module: "Agent",
        severity: "low",
        title: `Cross-sell ${next.product}`,
        detail: `${cover.participantName} has ${cover.productName}.`,
        href: "/app/quotes/new",
      });
      break;
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 12);
}

function daysUntil(iso: string) {
  const t = new Date(iso).getTime() - Date.now();
  return Math.ceil(t / 86_400_000);
}

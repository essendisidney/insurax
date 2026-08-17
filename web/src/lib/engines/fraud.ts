import type { Claim, Policy } from "../types";

export type FraudSignal = {
  type: string;
  severity: "low" | "medium" | "high";
  score: number;
  detail: string;
};

export function scoreClaim(claim: Pick<Claim, "claimed" | "incidentDate" | "reportedAt" | "location" | "policyId">, policy: Policy, history: Claim[]) {
  const signals: FraudSignal[] = [];

  const daysSinceInception =
    (new Date(claim.incidentDate).getTime() - new Date(policy.inception).getTime()) / 86_400_000;
  if (daysSinceInception < 14) {
    signals.push({
      type: "early_claim",
      severity: "high",
      score: 28,
      detail: "Incident within 14 days of inception.",
    });
  }

  const duplicates = history.filter(
    (c) =>
      c.policyId === claim.policyId &&
      Math.abs(new Date(c.incidentDate).getTime() - new Date(claim.incidentDate).getTime()) < 7 * 86_400_000,
  );
  if (duplicates.length) {
    signals.push({
      type: "duplicate_claim",
      severity: "high",
      score: 32,
      detail: "Similar claim already exists within 7 days.",
    });
  }

  const yearClaims = history.filter((c) => c.participantId === policy.participantId).length;
  if (yearClaims >= 2) {
    signals.push({
      type: "claim_frequency",
      severity: "medium",
      score: 18,
      detail: "Participant has multiple historical claims.",
    });
  }

  if (claim.claimed > policy.sumCovered * 0.8) {
    signals.push({
      type: "amount_outlier",
      severity: "medium",
      score: 16,
      detail: "Claimed amount is over 80% of sum covered.",
    });
  }

  if (!claim.location || claim.location.toLowerCase().includes("unknown")) {
    signals.push({
      type: "location_inconsistency",
      severity: "low",
      score: 8,
      detail: "Incident location missing or unverified.",
    });
  }

  const score = Math.min(99, signals.reduce((sum, s) => sum + s.score, 0));
  return { score, signals };
}

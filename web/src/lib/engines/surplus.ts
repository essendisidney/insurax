import type { Claim, Policy, SurplusPeriod, SurplusShare } from "../types";
import { round2 } from "./takaful";

export type SurplusDraftInput = {
  code: string;
  label: string;
  year: number;
  /** Share of net surplus to participants (default 0.7) */
  participantShareRate?: number;
  contingencyRate?: number;
  charityRate?: number;
  /** Optional override for investment income */
  investmentIncome?: number;
  /** Expense ratio of tabarru pool (default 0.08) */
  expenseRatio?: number;
};

/**
 * Compute period surplus from the risk fund (tabarru) after claims and expenses.
 * Wakala fees stay with the operator and are excluded from the surplus pool.
 */
export function computeSurplusFromBook(
  policies: Policy[],
  claims: Claim[],
  input: SurplusDraftInput,
): Omit<SurplusPeriod, "id" | "status" | "shariahNotes" | "createdAt" | "declaredAt" | "decidedAt" | "decidedBy"> {
  const participantRate = input.participantShareRate ?? 0.7;
  const contingencyRate = input.contingencyRate ?? 0.2;
  const charityRate = input.charityRate ?? 0.1;
  const sumRates = participantRate + contingencyRate + charityRate;
  const pRate = participantRate / sumRates;
  const cRate = contingencyRate / sumRates;
  const hRate = charityRate / sumRates;

  const active = policies.filter((p) => p.status === "active" || p.status === "expired");
  const tabarruPool = round2(active.reduce((s, p) => s + annualizedTabarru(p), 0));
  const claimsCost = round2(
    claims
      .filter((c) => ["paid", "closed", "approved", "pending_approval"].includes(c.status))
      .reduce((s, c) => s + (c.approved ?? c.claimed), 0),
  );
  const expenses = round2(tabarruPool * (input.expenseRatio ?? 0.08));
  const investmentIncome = round2(input.investmentIncome ?? tabarruPool * 0.035);
  const netSurplus = round2(Math.max(0, tabarruPool - claimsCost - expenses + investmentIncome));

  const participantPool = round2(netSurplus * pRate);
  const contingencyReserve = round2(netSurplus * cRate);
  const charityPool = round2(netSurplus - participantPool - contingencyReserve);

  const bases = aggregateTabarruByParticipant(active);
  const totalBase = bases.reduce((s, b) => s + b.tabarruBase, 0) || 1;
  const shares: SurplusShare[] = bases.map((b) => ({
    participantId: b.participantId,
    participantName: b.participantName,
    tabarruBase: b.tabarruBase,
    shareAmount: round2((b.tabarruBase / totalBase) * participantPool),
    status: "accrued" as const,
  }));

  return {
    code: input.code,
    label: input.label,
    year: input.year,
    tabarruPool,
    claimsCost,
    expenses,
    investmentIncome,
    netSurplus,
    participantPool,
    contingencyReserve,
    charityPool,
    participantShareRate: pRate,
    contingencyRate: cRate,
    charityRate: hRate,
    shares,
  };
}

function annualizedTabarru(p: Policy) {
  const t = p.tabarru;
  switch (p.frequency) {
    case "daily":
      return t * 365;
    case "weekly":
      return t * 52;
    case "monthly":
      return t * 12;
    case "quarterly":
      return t * 4;
    default:
      return t;
  }
}

function aggregateTabarruByParticipant(policies: Policy[]) {
  const map = new Map<string, { participantId: string; participantName: string; tabarruBase: number }>();
  for (const p of policies) {
    const cur = map.get(p.participantId) ?? {
      participantId: p.participantId,
      participantName: p.participantName,
      tabarruBase: 0,
    };
    cur.tabarruBase = round2(cur.tabarruBase + annualizedTabarru(p));
    map.set(p.participantId, cur);
  }
  return [...map.values()].sort((a, b) => b.tabarruBase - a.tabarruBase);
}

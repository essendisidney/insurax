import type { PlatformState } from "./types";

export function computeKpis(state: PlatformState) {
  const gwp = state.policies.reduce((sum, p) => sum + annualized(p.contribution, p.frequency), 0);
  const ceded = gwp * 0.28;
  const nwp = gwp - ceded;
  const paidClaims = state.claims
    .filter((c) => c.status === "paid" || c.status === "closed" || c.status === "approved")
    .reduce((sum, c) => sum + (c.approved ?? c.claimed), 0);
  const incurred = state.claims.reduce((sum, c) => sum + (c.approved ?? c.claimed), 0);
  const expense = gwp * 0.18;
  const active = state.policies.filter((p) => p.status === "active").length;
  const expired = state.policies.filter((p) => ["expired", "lapsed", "cancelled"].includes(p.status)).length;
  const renewable = state.policies.filter((p) => ["active", "expired", "lapsed"].includes(p.status)).length;
  const renewedLike = state.policies.filter((p) => p.status === "active" && p.inception < "2026-01-01").length + 1;
  const participants = new Set(state.policies.map((p) => p.participantId)).size;
  const avgPremium = active ? gwp / Math.max(state.policies.length, 1) : 0;
  const fraudRate = state.claims.length
    ? state.claims.filter((c) => c.fraudScore >= 60).length / state.claims.length
    : 0;
  const decided = state.claims.filter((c) =>
    ["paid", "closed", "approved", "rejected", "estimated", "pending_approval"].includes(c.status),
  );
  const tatHours = decided.length
    ? Math.round(
        decided.reduce((sum, c) => {
          const start = new Date(c.reportedAt).getTime();
          const end = Date.now();
          return sum + Math.max(1, (end - start) / 3600000);
        }, 0) / decided.length,
      )
    : 46;
  const claimsRatio = gwp ? incurred / gwp : 0;
  const lossRatio = gwp ? paidClaims / gwp : 0;
  const combined = lossRatio + 0.18;
  const renewalRate = renewable ? Math.min(0.92, (active - 1) / Math.max(renewable, 1) + 0.35) : 0;

  return {
    gwp,
    nwp,
    ceded,
    paidClaims,
    incurred,
    expense,
    claimsRatio,
    lossRatio,
    combined,
    renewalRate,
    active,
    expired,
    participants,
    avgPremium,
    fraudRate,
    tatHours,
    policyCount: state.policies.length,
    clv: 118400,
    renewedLike,
  };
}

/** Live chart series from the PAS book (policies + claims). */
export function computeAnalyticsSeries(state: PlatformState) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthIndex = (iso: string) => {
    const m = new Date(iso).getMonth();
    return m >= 0 && m <= 5 ? m : Math.min(5, Math.max(0, m % 6));
  };

  const gwpByMonth = months.map((month) => ({ month, gwp: 0, claims: 0 }));
  for (const p of state.policies) {
    const i = monthIndex(p.createdAt || p.inception);
    gwpByMonth[i].gwp += annualized(p.contribution, p.frequency) / 12;
  }
  for (const c of state.claims) {
    const i = monthIndex(c.reportedAt || c.incidentDate);
    gwpByMonth[i].claims += c.approved ?? c.claimed;
  }
  // Scale to millions for chart labels consistency
  const gwpByMonthM = gwpByMonth.map((row) => ({
    month: row.month,
    gwp: Math.round((row.gwp / 1_000_000) * 10) / 10 || 0.1,
    claims: Math.round((row.claims / 1_000_000) * 10) / 10,
  }));

  const productTotals = new Map<string, number>();
  for (const p of state.policies) {
    const name = shortProduct(p.productName);
    productTotals.set(name, (productTotals.get(name) ?? 0) + annualized(p.contribution, p.frequency));
  }
  const productSum = [...productTotals.values()].reduce((s, v) => s + v, 0) || 1;
  const gwpByProduct = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({
      name,
      value: Math.round((value / productSum) * 1000) / 10,
    }));

  const branchTotals = new Map<string, number>();
  for (const p of state.policies) {
    branchTotals.set(p.branch, (branchTotals.get(p.branch) ?? 0) + annualized(p.contribution, p.frequency));
  }
  const gwpByBranch = [...branchTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value: Math.round((value / 1_000_000) * 10) / 10 || 0.1,
    }));

  return { gwpByMonth: gwpByMonthM, gwpByProduct, gwpByBranch };
}

function shortProduct(name: string) {
  if (/boda|micro/i.test(name)) return "Micro";
  if (/motor/i.test(name)) return "Motor";
  if (/hospital|medical/i.test(name)) return "Medical";
  if (/family/i.test(name)) return "Family";
  if (/agri|crop/i.test(name)) return "Agri";
  if (/travel/i.test(name)) return "Travel";
  return name.split(" ").slice(0, 2).join(" ");
}

function annualized(amount: number, frequency: string) {
  switch (frequency) {
    case "daily":
      return amount * 365;
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    default:
      return amount;
  }
}

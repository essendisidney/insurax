import type { Product, UwDecision } from "../types";

export type UwInput = {
  product: Product;
  age?: number;
  vehicleAge?: number;
  medicalCondition?: string;
  claimsLast3Years?: number;
  sumCovered: number;
  /** CRB / bureau score 0–1000 when available */
  creditScore?: number;
};

export type UwResult = {
  decision: UwDecision;
  loadPercent: number;
  notes: string[];
};

export function underwrite(input: UwInput): UwResult {
  const notes: string[] = [];
  let decision: UwDecision = "auto_accept";
  let loadPercent = 0;

  const fail = (next: UwDecision, note: string) => {
    notes.push(note);
    if (next === "reject") {
      decision = "reject";
      return;
    }
    if (decision === "reject") return;
    if (next === "refer") decision = "refer";
    if (next === "load" && decision !== "refer") decision = "load";
  };

  if (input.product.line === "family_takaful" || input.product.line === "medical") {
    if ((input.age ?? 0) > 65) fail("reject", "Age exceeds 65 for this family/medical product.");
    else if ((input.age ?? 0) > 60) fail("refer", "Age 61–65 requires underwriter review.");
  }

  if (input.product.line === "motor") {
    if ((input.vehicleAge ?? 0) > 15) fail("refer", "Vehicle older than 15 years — refer to underwriter.");
    if ((input.vehicleAge ?? 0) > 12) {
      loadPercent += 10;
      fail("load", "Vehicle age loading +10%.");
    }
  }

  if ((input.medicalCondition ?? "").toLowerCase().includes("diabetes")) {
    loadPercent += 15;
    fail("load", "Diabetes loading +15%.");
  }

  if ((input.claimsLast3Years ?? 0) >= 3) fail("refer", "High claim frequency in last 3 years.");
  if (input.sumCovered > input.product.maxSumCovered) {
    fail("reject", "Requested cover exceeds product maximum.");
  }

  if (typeof input.creditScore === "number") {
    if (input.creditScore < 400) fail("reject", `CRB score ${input.creditScore} below minimum.`);
    else if (input.creditScore < 550) fail("refer", `CRB score ${input.creditScore} requires underwriter review.`);
    else if (input.creditScore < 650) {
      loadPercent += 10;
      fail("load", `CRB score ${input.creditScore} — loading +10%.`);
    }
  }

  if (decision === "auto_accept") notes.push("Straight-through underwriting approved.");
  return { decision, loadPercent, notes };
}

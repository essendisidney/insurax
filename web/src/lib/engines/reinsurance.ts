import type { Policy, Product, Treaty } from "@/lib/types";
import { round2 } from "@/lib/engines/takaful";

export function matchTreaties(policy: Policy, product: Product | undefined, treaties: Treaty[]) {
  const line = product?.line ?? "motor";
  return treaties.filter(
    (t) =>
      t.status === "active" &&
      (t.lines.includes(line) || t.lines.includes("*") || t.type === "facultative"),
  );
}

export function priceCession(grossContribution: number, cessionRate: number) {
  const cededContribution = round2(grossContribution * cessionRate);
  const retention = round2(grossContribution - cededContribution);
  return { cededContribution, retention };
}

export function suggestedRecovery(claimed: number, cessionRate: number) {
  return round2(claimed * cessionRate);
}

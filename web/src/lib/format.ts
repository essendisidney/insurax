import type { ClaimStatus, PaymentStatus, PolicyStatus, QuoteStatus, UserRole } from "./types";

const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export function money(value: number) {
  return kes.format(value);
}

export function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
  return money(value);
}

export function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    participant: "Participant",
    agent: "Agent",
    broker: "Broker",
    underwriter: "Underwriter",
    claims_officer: "Claims officer",
    claims_assessor: "Assessor",
    finance: "Finance",
    compliance: "Compliance",
    shariah_officer: "Shariah officer",
    admin: "Administrator",
    call_center: "Call center",
    branch_manager: "Branch manager",
  };
  return labels[role];
}

export function statusTone(status: string) {
  const map: Record<string, string> = {
    active: "ok",
    verified: "ok",
    completed: "ok",
    reconciled: "ok",
    paid: "ok",
    closed: "ok",
    approved: "ok",
    won: "ok",
    converted: "ok",
    accepted: "ok",
    sent: "ok",
    delivered: "ok",
    resolved: "ok",
    pending: "warn",
    pending_payment: "warn",
    pending_underwriting: "warn",
    pending_approval: "warn",
    in_review: "warn",
    under_review: "warn",
    documents_pending: "warn",
    assigned: "warn",
    assessing: "warn",
    estimated: "warn",
    processing: "warn",
    quoted: "warn",
    contacted: "warn",
    queued: "warn",
    referred: "warn",
    load: "warn",
    pending_shariah: "warn",
    distributed: "ok",
    accrued: "warn",
    payable: "ok",
    draft: "muted",
    new: "muted",
    open: "warn",
    suspended: "warn",
    expired: "muted",
    lapsed: "danger",
    cancelled: "danger",
    rejected: "danger",
    declined: "danger",
    failed: "danger",
    lost: "danger",
    fraud_check: "danger",
    reported: "warn",
    read: "muted",
    priced: "ok",
  };
  return map[status] ?? "muted";
}

export function prettyStatus(status: QuoteStatus | PolicyStatus | ClaimStatus | PaymentStatus | string) {
  return status.replaceAll("_", " ");
}

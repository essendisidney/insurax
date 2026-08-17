import type { UserRole } from "./types";

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[] | "*";
  section: string;
};

const STAFF_RISK: UserRole[] = ["underwriter", "admin", "branch_manager"];
const STAFF_FRAUD: UserRole[] = [
  "admin",
  "claims_officer",
  "claims_assessor",
  "underwriter",
  "compliance",
  "branch_manager",
];
const STAFF_CONNECT: UserRole[] = [
  "admin",
  "underwriter",
  "claims_officer",
  "claims_assessor",
  "compliance",
  "branch_manager",
];
const STAFF_AGENT: UserRole[] = ["agent", "admin", "branch_manager"];
const STAFF_AI: UserRole[] = ["admin", "underwriter", "claims_officer", "claims_assessor", "shariah_officer"];
const STAFF_DATA: UserRole[] = ["admin", "branch_manager", "finance", "underwriter", "shariah_officer"];
const STAFF_PAY: UserRole[] = ["finance", "admin", "shariah_officer"];
const STAFF_CARE: UserRole[] = ["call_center", "admin", "branch_manager", "agent"];

export const navItems: NavItem[] = [
  { href: "/app/dashboard", label: "Home", roles: "*", section: "Overview" },
  { href: "/app/modules", label: "Platform", roles: "*", section: "Overview" },

  { href: "/app/products", label: "Products", roles: "*", section: "Core" },
  { href: "/app/quotes", label: "Quotations", roles: "*", section: "Core" },
  { href: "/app/policies", label: "Policies", roles: "*", section: "Core" },
  { href: "/app/documents", label: "Documents", roles: "*", section: "Core" },

  { href: "/app/underwriting", label: "Underwriting", roles: STAFF_RISK, section: "Risk" },

  { href: "/app/claims", label: "Claims", roles: "*", section: "Claims" },

  { href: "/app/payments", label: "Collections", roles: "*", section: "Pay" },
  { href: "/app/finance", label: "Accounting", roles: STAFF_PAY, section: "Pay" },

  { href: "/app/fraud", label: "Fraud desk", roles: STAFF_FRAUD, section: "Fraud" },

  { href: "/app/integrations", label: "APIs & partners", roles: STAFF_CONNECT, section: "Connect" },
  { href: "/app/channels", label: "WhatsApp & USSD", roles: ["admin", "call_center", "agent", "branch_manager", "participant"], section: "Connect" },

  { href: "/app/agent", label: "Agency", roles: STAFF_AGENT, section: "Agent" },
  { href: "/app/broker", label: "Broker", roles: ["broker", "admin"], section: "Agent" },

  { href: "/app/ai", label: "Intelligence", roles: STAFF_AI, section: "AI" },

  { href: "/app/analytics", label: "Analytics", roles: STAFF_DATA, section: "Data" },
  { href: "/app/compliance", label: "Regulatory", roles: ["compliance", "admin", "shariah_officer"], section: "Data" },
  { href: "/app/shariah", label: "Surplus & Shariah", roles: ["shariah_officer", "finance", "admin"], section: "Data" },
  { href: "/app/reinsurance", label: "Reinsurance", roles: ["finance", "admin", "underwriter"], section: "Data" },

  { href: "/app/customer", label: "Self-service", roles: "*", section: "Customer" },
  { href: "/app/crm", label: "CRM & care", roles: STAFF_CARE, section: "Customer" },
  { href: "/app/notifications", label: "Notifications", roles: "*", section: "Customer" },
  { href: "/app/profile", label: "Profile & KYC", roles: "*", section: "Customer" },

  { href: "/app/admin", label: "Administration", roles: ["admin"], section: "Admin" },
];

export function visibleNav(role: UserRole) {
  return navItems.filter((item) => item.roles === "*" || item.roles.includes(role));
}

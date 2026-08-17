import { navItems } from "./nav";
import type { UserRole } from "./types";

/** Longest-prefix match against nav entries; used for route RBAC. */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;

  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/app" || normalized === "/app/dashboard") return true;

  const matches = navItems
    .filter((item) => normalized === item.href || normalized.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);

  const best = matches[0];
  if (!best) {
    // Unknown /app routes: deny for non-admin (forces explicit nav entries)
    return false;
  }
  return best.roles === "*" || best.roles.includes(role);
}

export function forbiddenMessage(role: UserRole, pathname: string) {
  return `Your role (${role}) cannot open ${pathname}. Choose a different persona or ask an admin.`;
}

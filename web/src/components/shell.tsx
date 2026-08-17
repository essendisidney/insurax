"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { visibleNav } from "@/lib/nav";
import { cn } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const items = useMemo(() => (user ? visibleNav(user.role) : []), [user]);
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return [...map.entries()];
  }, [items]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center atmosphere text-mute">
        Loading InsuraX desk…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-72 atmosphere-deep text-champagne transition md:static md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <Link href="/app/dashboard" className="brand-mark text-3xl tracking-[0.08em] text-gold">
              InsuraX
            </Link>
            <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              Close
            </button>
          </div>
          <p className="px-5 pb-5 text-[11px] uppercase tracking-[0.22em] text-champagne/50">
            Insurance operating platform
          </p>
          <nav className="h-[calc(100vh-11rem)] space-y-5 overflow-y-auto px-3 pb-8">
            {grouped.map(([section, links]) => (
              <div key={section}>
                <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-champagne/40">{section}</p>
                <div className="space-y-1">
                  {links.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-xl px-3 py-2.5 text-sm transition",
                          active
                            ? "bg-teal/25 text-gold"
                            : "text-champagne/75 hover:bg-white/5 hover:text-champagne",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3.5 backdrop-blur md:px-8">
            <button
              className="rounded-xl border border-line px-3 py-1.5 text-sm md:hidden"
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
            <div className="hidden text-sm text-mute md:block">
              {user.branch} · One platform. Every insurance workflow.
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-forest">{user.name}</p>
                <p className="text-xs text-mute">{roleLabel(user.role)}</p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="rounded-xl border border-line px-3 py-1.5 text-xs hover:border-teal hover:text-teal"
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

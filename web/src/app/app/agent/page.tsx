"use client";

import { useState } from "react";
import Link from "next/link";
import { agents } from "@/lib/seed";
import { useAuth } from "@/lib/auth";
import { withdrawCommission } from "@/lib/events/ledger";
import { money, pct } from "@/lib/format";
import { platformStore, usePlatform } from "@/lib/store";
import type { Lead, ProductLine } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, Stat, Table, inputClass } from "@/components/ui";

const lines: ProductLine[] = ["motor", "medical", "micro", "family_takaful", "travel", "agriculture"];

export default function AgentPage() {
  const { user } = useAuth();
  const { leads, quotes, policies, balanceDeltas } = usePlatform();
  const agent = agents.find((a) => a.id === user?.agentId) ?? agents[0];
  const delta = balanceDeltas[agent.id] ?? { wallet: 0, gwp: 0 };
  const liveWallet = agent.wallet + delta.wallet;
  const liveGwp = agent.ytdGwp + delta.gwp;
  const progress = liveGwp / agent.target;
  const mine = leads.filter((l) => l.agentId === agent.id);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+2547");
  const [productLine, setProductLine] = useState<ProductLine>("micro");
  const [notes, setNotes] = useState("");

  function addLead() {
    if (!name.trim() || !phone.trim()) return;
    const lead: Lead = {
      id: `ld-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      phone: phone.trim(),
      productLine,
      status: "new",
      agentId: agent.id,
      notes: notes.trim(),
    };
    platformStore.addLead(lead);
    setName("");
    setNotes("");
    setPhone("+2547");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agency portal"
        title={`${agent.name} desk`}
        description="Capture leads offline-ready, quote from the book, and track wallet / targets."
        actions={<Button href="/app/quotes/new">New quotation</Button>}
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="YTD GWP" value={money(liveGwp)} hint={`${pct(progress)} of target`} />
        <Stat label="Target" value={money(agent.target)} />
        <Stat label="Wallet" value={money(liveWallet)} hint="Commission available" />
        <Stat label="Open leads" value={String(mine.filter((l) => l.status !== "won" && l.status !== "lost").length)} hint={agent.code} />
      </div>
      {liveWallet > 0 ? (
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() =>
              withdrawCommission({
                distributorId: agent.id,
                name: agent.name,
                amount: Math.min(liveWallet, Math.round(liveWallet * 0.5) || liveWallet),
                kind: "agent",
              })
            }
          >
            Withdraw 50% wallet
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-xl">Capture lead</h2>
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Interest">
            <select
              className={inputClass}
              value={productLine}
              onChange={(e) => setProductLine(e.target.value as ProductLine)}
            >
              {lines.map((l) => (
                <option key={l} value={l}>
                  {l.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button onClick={addLead}>Save lead</Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl">Book snapshot</h2>
          <p className="mt-2 text-sm text-mute">
            {quotes.filter((q) => q.agentId === agent.id).length} quotes ·{" "}
            {policies.filter((p) => p.agentId === agent.id).length} policies · {mine.length} leads
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-teal" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-mute">
            Flutter field app: <code className="text-ink">agent_app/</code> ·{" "}
            <Link href="/app/channels" className="text-teal">
              WhatsApp &amp; USSD
            </Link>
          </p>
        </Card>
      </div>

      <Card className="mt-4 p-2">
        <h2 className="px-3 pt-3 font-display text-xl">My leads</h2>
        <Table headers={["Name", "Product", "Status", "Notes", ""]}>
          {mine.map((l) => (
            <tr key={l.id} className="border-b border-line/70">
              <td className="px-3 py-3">
                {l.name}
                <div className="text-xs text-mute">{l.phone}</div>
              </td>
              <td className="px-3 py-3 capitalize">{l.productLine.replaceAll("_", " ")}</td>
              <td className="px-3 py-3">
                <Badge status={l.status} />
              </td>
              <td className="max-w-xs px-3 py-3 text-xs text-mute">{l.notes || "—"}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {l.status === "new" ? (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => platformStore.updateLead(l.id, { status: "contacted" })}
                    >
                      Contacted
                    </Button>
                  ) : null}
                  {l.status === "contacted" || l.status === "new" ? (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => platformStore.updateLead(l.id, { status: "quoted" })}
                    >
                      Mark quoted
                    </Button>
                  ) : null}
                  {l.status !== "won" && l.status !== "lost" ? (
                    <>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => platformStore.updateLead(l.id, { status: "won" })}
                      >
                        Won
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-xs"
                        onClick={() => platformStore.updateLead(l.id, { status: "lost" })}
                      >
                        Lost
                      </Button>
                    </>
                  ) : null}
                  <Button href={`/app/quotes/new?lead=${l.id}`} variant="secondary" className="!px-2 !py-1 text-xs">
                    Quote
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {mine.length === 0 ? <p className="p-6 text-sm text-mute">No leads yet — capture one above.</p> : null}
      </Card>
    </div>
  );
}

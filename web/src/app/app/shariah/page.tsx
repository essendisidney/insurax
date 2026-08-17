"use client";

import { useMemo, useState } from "react";
import { computeSurplusFromBook } from "@/lib/engines/surplus";
import { postJournal, pushNotification } from "@/lib/events/ledger";
import { useAuth } from "@/lib/auth";
import { money, pct } from "@/lib/format";
import { platformStore, usePlatform } from "@/lib/store";
import type { SurplusPeriod } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, Stat, Table, inputClass } from "@/components/ui";

export default function ShariahPage() {
  const { user } = useAuth();
  const { policies, claims, surplusPeriods } = usePlatform();
  const [label, setLabel] = useState("H1 2026 interim surplus");
  const [code, setCode] = useState("H1-2026");
  const [investment, setInvestment] = useState(180000);
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(surplusPeriods[0]?.id ?? null);

  const selected = surplusPeriods.find((p) => p.id === selectedId) ?? surplusPeriods[0] ?? null;
  const pending = surplusPeriods.filter((p) => p.status === "pending_shariah");
  const canFinance = user?.role === "finance" || user?.role === "admin" || user?.role === "shariah_officer";
  const canShariah = user?.role === "shariah_officer" || user?.role === "admin";

  const preview = useMemo(
    () =>
      computeSurplusFromBook(policies, claims, {
        code,
        label,
        year: 2026,
        investmentIncome: investment,
      }),
    [policies, claims, code, label, investment],
  );

  function declarePeriod() {
    const computed = computeSurplusFromBook(policies, claims, {
      code,
      label,
      year: 2026,
      investmentIncome: investment,
    });
    const period: SurplusPeriod = {
      id: crypto.randomUUID(),
      ...computed,
      status: "pending_shariah",
      shariahNotes: notes.trim(),
      declaredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    platformStore.addSurplusPeriod(period);
    postJournal({
      reference: period.code,
      memo: `Surplus declared · net ${period.netSurplus}`,
      debit: period.netSurplus,
      credit: period.netSurplus,
    });
    pushNotification({
      channel: "email",
      title: "Surplus pending Shariah",
      body: `${period.label} submitted for board review · net KES ${Math.round(period.netSurplus).toLocaleString()}`,
    });
    setSelectedId(period.id);
    setNotes("");
  }

  function decide(id: string, status: "approved" | "rejected") {
    platformStore.updateSurplusPeriod(id, {
      status,
      decidedAt: new Date().toISOString(),
      decidedBy: user?.id,
      shariahNotes:
        status === "approved"
          ? notes.trim() || selected?.shariahNotes || "Shariah board approved surplus distribution under wakala."
          : notes.trim() || "Returned for revision — allocation or investment screening incomplete.",
    });
  }

  function distribute(id: string) {
    const period = surplusPeriods.find((p) => p.id === id);
    if (!period) return;
    platformStore.updateSurplusPeriod(id, {
      status: "distributed",
      shares: period.shares.map((s) => ({ ...s, status: "paid" as const })),
    });
    postJournal({
      reference: period.code,
      memo: `Surplus distributed · ${period.label}`,
      debit: period.netSurplus,
      credit: period.netSurplus,
    });
    pushNotification({
      channel: "sms",
      title: "Surplus distributed",
      body: `${period.label}: net KES ${Math.round(period.netSurplus).toLocaleString()} paid to participants.`,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shariah & surplus"
        title="Risk fund surplus"
        description="Tabarru pool after claims and expenses. Finance declares; the Shariah board approves before participant distribution."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Periods" value={String(surplusPeriods.length)} />
        <Stat label="Awaiting Shariah" value={String(pending.length)} />
        <Stat
          label="Latest net surplus"
          value={money(surplusPeriods[0]?.netSurplus ?? 0)}
          hint={surplusPeriods[0]?.code}
        />
        <Stat
          label="Participant pool"
          value={money(surplusPeriods[0]?.participantPool ?? 0)}
          hint={surplusPeriods[0] ? pct(surplusPeriods[0].participantShareRate) : undefined}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-xl">Declare from book</h2>
          <p className="text-sm text-mute">
            Computes tabarru from active policies, deducts claims and expenses, adds investment income, then splits
            70% / 20% / 10% (participants / contingency / charity).
          </p>
          <Field label="Period code">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Label">
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Investment income (KES)">
            <input
              className={inputClass}
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
            />
          </Field>
          <div className="rounded-xl border border-line bg-sand/40 p-3 text-sm">
            <p>
              Tabarru {money(preview.tabarruPool)} − claims {money(preview.claimsCost)} − expenses{" "}
              {money(preview.expenses)} + investment {money(preview.investmentIncome)}
            </p>
            <p className="mt-1 font-medium text-ink">Net surplus {money(preview.netSurplus)}</p>
            <p className="mt-1 text-mute">
              Participants {money(preview.participantPool)} · Contingency {money(preview.contingencyReserve)} · Charity{" "}
              {money(preview.charityPool)}
            </p>
          </div>
          {canFinance ? (
            <Button onClick={declarePeriod}>Submit for Shariah review</Button>
          ) : (
            <p className="text-xs text-mute">Switch to finance or Shariah persona to declare.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl">Periods</h2>
          <div className="mt-3 space-y-2">
            {surplusPeriods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                  selected?.id === p.id ? "border-teal bg-teal/5" : "border-line hover:border-teal"
                }`}
              >
                <span>
                  <span className="font-medium text-ink">{p.code}</span>
                  <span className="mt-0.5 block text-xs text-mute">{p.label}</span>
                </span>
                <Badge status={p.status} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {selected ? (
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{selected.label}</h2>
              <p className="mt-1 text-sm text-mute">
                {selected.code} · net {money(selected.netSurplus)} · {selected.shares.length} participants
              </p>
            </div>
            <Badge status={selected.status} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-line p-3">
              <p className="text-mute">Tabarru pool</p>
              <p className="font-medium">{money(selected.tabarruPool)}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="text-mute">Claims + expenses</p>
              <p className="font-medium">{money(selected.claimsCost + selected.expenses)}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="text-mute">Allocation</p>
              <p className="font-medium">
                {pct(selected.participantShareRate)} / {pct(selected.contingencyRate)} / {pct(selected.charityRate)}
              </p>
            </div>
          </div>

          <Field label="Shariah notes">
            <textarea
              className={inputClass}
              rows={2}
              value={notes || selected.shariahNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Board remarks, screening notes…"
            />
          </Field>

          <div className="mt-3 flex flex-wrap gap-2">
            {canShariah && selected.status === "pending_shariah" ? (
              <>
                <Button onClick={() => decide(selected.id, "approved")}>Approve</Button>
                <Button variant="danger" onClick={() => decide(selected.id, "rejected")}>
                  Return
                </Button>
              </>
            ) : null}
            {canFinance && selected.status === "approved" ? (
              <Button onClick={() => distribute(selected.id)}>Mark distributed</Button>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table headers={["Participant", "Tabarru base", "Share", "Status"]}>
              {selected.shares.map((s) => (
                <tr key={s.participantId} className="border-b border-line/70">
                  <td className="px-3 py-3">{s.participantName}</td>
                  <td className="px-3 py-3">{money(s.tabarruBase)}</td>
                  <td className="px-3 py-3 font-medium">{money(s.shareAmount)}</td>
                  <td className="px-3 py-3">
                    <Badge status={s.status} />
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

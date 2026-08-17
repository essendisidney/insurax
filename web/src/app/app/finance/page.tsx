"use client";

import { money } from "@/lib/format";
import { usePlatform } from "@/lib/store";
import { Card, PageHeader, Stat, Table } from "@/components/ui";

export default function FinancePage() {
  const state = usePlatform();
  const journals = state.journals;
  const debit = journals.reduce((s, j) => s + j.debit, 0);
  const credit = journals.reduce((s, j) => s + j.credit, 0);
  const gwp = state.policies.reduce((s, p) => s + p.contribution, 0);
  const wakala = state.policies.reduce((s, p) => s + p.wakala, 0);
  const claimsExpense = state.claims
    .filter((c) => ["paid", "closed", "approved"].includes(c.status))
    .reduce((s, c) => s + (c.approved ?? c.claimed), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Accounting"
        title="Takaful ledger & ERP hooks"
        description="Journals post automatically from contributions, claims and surplus. Ready for SAP, Oracle, Dynamics, Sage and QuickBooks."
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Contribution revenue" value={money(gwp)} />
        <Stat label="Wakala income" value={money(wakala)} />
        <Stat label="Claims expense" value={money(claimsExpense)} />
        <Stat label="Journal volume" value={money(debit)} hint={`${journals.length} entries`} />
      </div>
      <Card className="mt-6 p-2">
        <h2 className="px-3 pt-3 font-display text-xl">General ledger</h2>
        <Table headers={["Date", "Reference", "Memo", "Debit", "Credit"]}>
          {journals.map((j) => (
            <tr key={j.id} className="border-b border-line/70">
              <td className="px-3 py-3">{j.date}</td>
              <td className="px-3 py-3 font-medium">{j.reference}</td>
              <td className="px-3 py-3">{j.memo}</td>
              <td className="px-3 py-3">{money(j.debit)}</td>
              <td className="px-3 py-3">{money(j.credit)}</td>
            </tr>
          ))}
        </Table>
        <p className="px-3 py-3 text-xs text-mute">
          Totals · debit {money(debit)} · credit {money(credit)}
        </p>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
        {["Participants' risk fund (tabarru)", "Operator wakala account", "Surplus distribution reserve"].map((name) => (
          <Card key={name} className="p-4">
            <p className="text-mute">GL account</p>
            <p className="mt-1 font-medium">{name}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5 text-sm">
        <p className="font-medium text-ink">Surplus workflow</p>
        <p className="mt-2 text-mute">
          Declare and allocate participant surplus on the{" "}
          <a href="/app/shariah" className="text-teal underline-offset-2 hover:underline">
            Surplus &amp; Shariah
          </a>{" "}
          desk. Payments auto-post journals via the event ledger.
        </p>
      </Card>
    </div>
  );
}

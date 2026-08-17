"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { matchTreaties, priceCession, suggestedRecovery } from "@/lib/engines/reinsurance";
import { pushNotification, recordCessionJournal, recordRecoveryPaid } from "@/lib/events/ledger";
import { money, pct } from "@/lib/format";
import { products } from "@/lib/seed";
import { platformStore, usePlatform } from "@/lib/store";
import type { ReinsuranceCession, ReinsuranceRecovery } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, Stat, Table, inputClass } from "@/components/ui";

export default function ReinsurancePage() {
  const { treaties, cessions, recoveries, policies, claims } = usePlatform();
  const [treatyId, setTreatyId] = useState(treaties[0]?.id ?? "");
  const [policyId, setPolicyId] = useState("");
  const [claimId, setClaimId] = useState("");
  const [msg, setMsg] = useState("");

  const activeTreaties = treaties.filter((t) => t.status === "active");
  const totalCeded = treaties.reduce((s, t) => s + t.cededYtd, 0);
  const totalRecoveries = treaties.reduce((s, t) => s + t.recoveriesYtd, 0);
  const pendingRecoveries = recoveries.filter((r) => r.status !== "paid");

  const resolvedPolicyId = policyId || policies.find((p) => p.status === "active")?.id || "";
  const resolvedClaimId = claimId || claims[0]?.id || "";
  const selectedTreaty = treaties.find((t) => t.id === treatyId) ?? treaties[0];
  const selectedPolicy = policies.find((p) => p.id === resolvedPolicyId);
  const selectedClaim = claims.find((c) => c.id === resolvedClaimId);

  const suggested = useMemo(() => {
    if (!selectedPolicy) return [];
    const product = products.find((p) => p.id === selectedPolicy.productId);
    return matchTreaties(selectedPolicy, product, treaties);
  }, [selectedPolicy, treaties]);

  function cedePolicy() {
    if (!selectedPolicy || !selectedTreaty) return;
    if (cessions.some((c) => c.policyId === selectedPolicy.id && c.treatyId === selectedTreaty.id)) {
      setMsg("This policy is already ceded to that treaty.");
      return;
    }
    const product = products.find((p) => p.id === selectedPolicy.productId);
    const { cededContribution, retention } = priceCession(selectedPolicy.contribution, selectedTreaty.cessionRate);
    const row: ReinsuranceCession = {
      id: `ces-${crypto.randomUUID().slice(0, 8)}`,
      treatyId: selectedTreaty.id,
      treatyName: selectedTreaty.name,
      policyId: selectedPolicy.id,
      policyNumber: selectedPolicy.number,
      participantName: selectedPolicy.participantName,
      productLine: product?.line ?? "motor",
      grossContribution: selectedPolicy.contribution,
      cededContribution,
      retention,
      createdAt: new Date().toISOString(),
    };
    platformStore.addCession(row);
    recordCessionJournal({
      policyNumber: selectedPolicy.number,
      treatyName: selectedTreaty.name,
      cededContribution,
    });
    setMsg(`Ceded ${money(cededContribution)} on ${selectedPolicy.number} to ${selectedTreaty.name}.`);
  }

  function submitRecovery() {
    if (!selectedClaim || !selectedTreaty) return;
    const amount = suggestedRecovery(selectedClaim.approved ?? selectedClaim.claimed, selectedTreaty.cessionRate);
    const row: ReinsuranceRecovery = {
      id: `rec-${crypto.randomUUID().slice(0, 8)}`,
      treatyId: selectedTreaty.id,
      treatyName: selectedTreaty.name,
      claimId: selectedClaim.id,
      claimNumber: selectedClaim.number,
      amount,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    platformStore.addRecovery(row);
    pushNotification({
      channel: "email",
      title: "Recovery submitted",
      body: `${selectedClaim.number}: recovery ${money(amount)} filed with ${selectedTreaty.name}.`,
    });
    setMsg(`Recovery ${money(amount)} submitted on ${selectedClaim.number}.`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reinsurance"
        title="Facultative, treaty, recoveries"
        description="Cede policies to treaties, track YTD cessions, and submit claim recoveries."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Active treaties" value={String(activeTreaties.length)} />
        <Stat label="Ceded YTD" value={money(totalCeded)} />
        <Stat label="Recoveries YTD" value={money(totalRecoveries)} />
        <Stat label="Open recoveries" value={String(pendingRecoveries.length)} />
      </div>

      <Card className="mt-6 p-2">
        <h2 className="px-3 pt-3 font-display text-xl">Treaties</h2>
        <Table headers={["Treaty", "Type", "Reinsurer", "Cession", "Lines", "Ceded YTD", "Recoveries", "Status"]}>
          {treaties.map((t) => (
            <tr key={t.id} className="border-b border-line/70">
              <td className="px-3 py-3">
                <button
                  type="button"
                  className="text-left font-medium text-teal hover:underline"
                  onClick={() => setTreatyId(t.id)}
                >
                  {t.name}
                </button>
              </td>
              <td className="px-3 py-3 capitalize">{t.type}</td>
              <td className="px-3 py-3">{t.reinsurer}</td>
              <td className="px-3 py-3">{pct(t.cessionRate)}</td>
              <td className="px-3 py-3 text-xs text-mute">{t.lines.join(", ")}</td>
              <td className="px-3 py-3">{money(t.cededYtd)}</td>
              <td className="px-3 py-3">{money(t.recoveriesYtd)}</td>
              <td className="px-3 py-3">
                <Badge status={t.status === "active" ? "active" : "expired"} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-xl">Cede policy</h2>
          <Field label="Treaty">
            <select className={inputClass} value={treatyId} onChange={(e) => setTreatyId(e.target.value)}>
              {treaties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {pct(t.cessionRate)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Policy">
            <select className={inputClass} value={resolvedPolicyId} onChange={(e) => setPolicyId(e.target.value)}>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} · {p.productName} · {money(p.contribution)}
                </option>
              ))}
            </select>
          </Field>
          {selectedPolicy && selectedTreaty ? (
            <p className="text-sm text-mute">
              Will cede {money(priceCession(selectedPolicy.contribution, selectedTreaty.cessionRate).cededContribution)}{" "}
              · retain {money(priceCession(selectedPolicy.contribution, selectedTreaty.cessionRate).retention)}
            </p>
          ) : null}
          {suggested.length ? (
            <p className="text-xs text-mute">
              Suggested: {suggested.map((t) => t.name).join(" · ")}
            </p>
          ) : null}
          <Button onClick={cedePolicy}>Record cession</Button>
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-display text-xl">Claim recovery</h2>
          <Field label="Treaty">
            <select className={inputClass} value={treatyId} onChange={(e) => setTreatyId(e.target.value)}>
              {treaties.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {pct(t.cessionRate)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Claim">
            <select className={inputClass} value={resolvedClaimId} onChange={(e) => setClaimId(e.target.value)}>
              {claims.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} · {money(c.approved ?? c.claimed)} · {c.status}
                </option>
              ))}
            </select>
          </Field>
          {selectedClaim && selectedTreaty ? (
            <p className="text-sm text-mute">
              Suggested recovery{" "}
              {money(suggestedRecovery(selectedClaim.approved ?? selectedClaim.claimed, selectedTreaty.cessionRate))}
            </p>
          ) : null}
          <Button variant="secondary" onClick={submitRecovery}>
            Submit recovery
          </Button>
        </Card>
      </div>

      {msg ? <p className="mt-3 text-sm text-teal">{msg}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-2">
          <h2 className="px-3 pt-3 font-display text-xl">Cessions</h2>
          <Table headers={["Policy", "Treaty", "Ceded", "Retention", "When"]}>
            {cessions.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <Link className="font-medium text-teal" href={`/app/policies/${c.policyId}`}>
                    {c.policyNumber}
                  </Link>
                  <div className="text-xs text-mute">{c.participantName}</div>
                </td>
                <td className="px-3 py-3 text-sm">{c.treatyName}</td>
                <td className="px-3 py-3">{money(c.cededContribution)}</td>
                <td className="px-3 py-3">{money(c.retention)}</td>
                <td className="px-3 py-3 text-xs text-mute">{c.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </Table>
          {cessions.length === 0 ? <p className="p-6 text-sm text-mute">No cessions yet.</p> : null}
        </Card>

        <Card className="p-2">
          <h2 className="px-3 pt-3 font-display text-xl">Recoveries</h2>
          <Table headers={["Claim", "Treaty", "Amount", "Status", ""]}>
            {recoveries.map((r) => (
              <tr key={r.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <Link className="font-medium text-teal" href={`/app/claims/${r.claimId}`}>
                    {r.claimNumber}
                  </Link>
                </td>
                <td className="px-3 py-3 text-sm">{r.treatyName}</td>
                <td className="px-3 py-3">{money(r.amount)}</td>
                <td className="px-3 py-3">
                  <Badge status={r.status === "paid" ? "paid" : r.status === "accepted" ? "verified" : "pending"} />
                </td>
                <td className="px-3 py-3">
                  {r.status === "submitted" ? (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        platformStore.updateRecovery(r.id, { status: "accepted" });
                        pushNotification({
                          channel: "email",
                          title: "Recovery accepted",
                          body: `${r.claimNumber} recovery accepted by ${r.treatyName}.`,
                        });
                      }}
                    >
                      Accept
                    </Button>
                  ) : null}
                  {r.status === "accepted" ? (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        recordRecoveryPaid({
                          claimNumber: r.claimNumber,
                          treatyName: r.treatyName,
                          amount: r.amount,
                          treatyId: r.treatyId,
                        });
                        platformStore.updateRecovery(r.id, { status: "paid" });
                      }}
                    >
                      Mark paid
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
          {recoveries.length === 0 ? <p className="p-6 text-sm text-mute">No recoveries yet.</p> : null}
        </Card>
      </div>
    </div>
  );
}

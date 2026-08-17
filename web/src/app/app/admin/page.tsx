"use client";

import { demoUsers } from "@/lib/seed";
import { roleLabel } from "@/lib/format";
import { platformStore, usePlatform } from "@/lib/store";
import { Button, Card, PageHeader, Table } from "@/components/ui";

export default function AdminPage() {
  const { auditLogs } = usePlatform();

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Users, roles, workflows, branches"
        description="RBAC, approval hierarchies, product configuration, commission rules and system settings."
      />
      <Card className="p-2">
        <Table headers={["Name", "Role", "Branch", "Email"]}>
          {demoUsers.map((u) => (
            <tr key={u.id} className="border-b border-line/70">
              <td className="px-3 py-3 font-medium">{u.name}</td>
              <td className="px-3 py-3">{roleLabel(u.role)}</td>
              <td className="px-3 py-3">{u.branch}</td>
              <td className="px-3 py-3 text-mute">{u.email}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-4 p-2">
        <h2 className="px-3 pt-3 font-display text-xl">Audit trail</h2>
        <Table headers={["When", "Action", "Actor", "Subject", "Detail"]}>
          {auditLogs.slice(0, 40).map((a) => (
            <tr key={a.id} className="border-b border-line/70">
              <td className="px-3 py-3 text-xs text-mute">{a.createdAt.slice(0, 16).replace("T", " ")}</td>
              <td className="px-3 py-3 text-sm font-medium">{a.action}</td>
              <td className="px-3 py-3 text-sm">{a.actor}</td>
              <td className="px-3 py-3 text-sm">{a.subject}</td>
              <td className="max-w-xs px-3 py-3 text-xs text-mute">{a.detail}</td>
            </tr>
          ))}
        </Table>
        {auditLogs.length === 0 ? (
          <p className="p-6 text-sm text-mute">No audit events yet — KYC, AML, policy lifecycle and IRA export write here.</p>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {["MFA + device management", "Encryption at rest & in transit", "Audit trails & backups"].map((item) => (
          <Card key={item} className="p-4 text-sm">
            {item}
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <Button
          variant="secondary"
          onClick={() => {
            platformStore.reset();
            platformStore.addAuditLog({
              action: "admin.reset",
              actor: "Admin",
              subject: "Demo book",
              detail: "Platform demo data reset to seed.",
            });
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";

export type AgentSyncPayload = {
  agentId?: string;
  items: Array<{
    entity: "lead" | "quote" | "collection" | "claim";
    id: string;
    data: Record<string, unknown>;
  }>;
};

/**
 * Ingest offline agent sync batches from the Flutter field app.
 * Persists to demo acknowledgement for now; wire to Supabase/PAS when ready.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as AgentSyncPayload;
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  const accepted = body.items.map((item) => ({
    id: item.id,
    entity: item.entity,
    status: "accepted" as const,
  }));

  return NextResponse.json({
    ok: true,
    agentId: body.agentId ?? null,
    accepted,
    at: new Date().toISOString(),
  });
}

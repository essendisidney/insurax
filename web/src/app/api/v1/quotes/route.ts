import { NextResponse } from "next/server";
import { authenticatePartner, unauthorized } from "@/lib/partners/api_auth";
import { v1CreateQuote, v1GetQuote } from "@/lib/partners/v1_store";
import type { Frequency } from "@/lib/types";

export async function POST(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();

  const body = (await req.json()) as {
    productId?: string;
    productSlug?: string;
    participantName?: string;
    participantId?: string;
    sumCovered?: number;
    frequency?: Frequency;
    risk?: Record<string, string | number | boolean>;
  };

  if (!body.participantName?.trim() || !body.sumCovered || !body.frequency) {
    return NextResponse.json(
      { error: "participantName, sumCovered and frequency are required" },
      { status: 400 },
    );
  }

  try {
    const quote = v1CreateQuote({
      productId: body.productId,
      productSlug: body.productSlug ?? "boda-micro",
      participantName: body.participantName,
      participantId: body.participantId,
      sumCovered: body.sumCovered,
      frequency: body.frequency,
      risk: body.risk,
      partnerId: partner.partnerId,
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Quote failed" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query required" }, { status: 400 });
  const quote = v1GetQuote(id);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quote });
}

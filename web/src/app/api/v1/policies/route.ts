import { NextResponse } from "next/server";
import { authenticatePartner, unauthorized } from "@/lib/partners/api_auth";
import { v1BindPolicy, v1GetPolicy } from "@/lib/partners/v1_store";

export async function POST(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();

  const body = (await req.json()) as { quoteId?: string; quoteNumber?: string };
  const key = body.quoteId ?? body.quoteNumber;
  if (!key) {
    return NextResponse.json({ error: "quoteId or quoteNumber required" }, { status: 400 });
  }

  try {
    const policy = v1BindPolicy(key, partner.partnerId);
    return NextResponse.json({ policy }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bind failed" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();
  const number = new URL(req.url).searchParams.get("number");
  if (!number) return NextResponse.json({ error: "number query required" }, { status: 400 });
  const policy = v1GetPolicy(number);
  if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ policy });
}

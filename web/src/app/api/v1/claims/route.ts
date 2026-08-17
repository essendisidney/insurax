import { NextResponse } from "next/server";
import { authenticatePartner, unauthorized } from "@/lib/partners/api_auth";
import { v1CreateClaim, v1GetClaim } from "@/lib/partners/v1_store";

export async function POST(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();

  const body = (await req.json()) as {
    policyNumber?: string;
    description?: string;
    claimed?: number;
    incidentDate?: string;
    location?: string;
  };

  if (!body.policyNumber || !body.description?.trim() || !body.claimed) {
    return NextResponse.json(
      { error: "policyNumber, description and claimed are required" },
      { status: 400 },
    );
  }

  try {
    const claim = v1CreateClaim({
      policyNumber: body.policyNumber,
      description: body.description,
      claimed: body.claimed,
      incidentDate: body.incidentDate,
      location: body.location,
    });
    return NextResponse.json({ claim }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Claim failed" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();
  const number = new URL(req.url).searchParams.get("number");
  if (!number) return NextResponse.json({ error: "number query required" }, { status: 400 });
  const claim = v1GetClaim(number);
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ claim });
}

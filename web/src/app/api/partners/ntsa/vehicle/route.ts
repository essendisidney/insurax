import { NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/partners/ntsa";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    registrationNumber?: string;
    chassisNumber?: string;
  };

  if (!body.registrationNumber?.trim()) {
    return NextResponse.json({ error: "registrationNumber is required" }, { status: 400 });
  }

  const result = await lookupVehicle({
    registrationNumber: body.registrationNumber,
    chassisNumber: body.chassisNumber,
  });

  return NextResponse.json(result);
}

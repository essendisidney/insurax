import { NextResponse } from "next/server";
import { verifyNationalId } from "@/lib/partners/iprs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    idNumber?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  };

  if (!body.idNumber?.trim()) {
    return NextResponse.json({ error: "idNumber is required" }, { status: 400 });
  }

  const result = await verifyNationalId({
    idNumber: body.idNumber,
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth,
  });

  return NextResponse.json(result);
}

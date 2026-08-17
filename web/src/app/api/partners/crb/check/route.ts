import { NextResponse } from "next/server";
import { checkCredit } from "@/lib/partners/crb";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    idNumber?: string;
    fullName?: string;
    phone?: string;
  };

  if (!body.idNumber?.trim()) {
    return NextResponse.json({ error: "idNumber is required" }, { status: 400 });
  }

  const result = await checkCredit({
    idNumber: body.idNumber,
    fullName: body.fullName,
    phone: body.phone,
  });

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { getPendingStk, listPendingStk } from "@/lib/mpesa/pending";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestId = searchParams.get("checkoutRequestId");

  if (checkoutRequestId) {
    const row = getPendingStk(checkoutRequestId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  }

  return NextResponse.json({ items: listPendingStk().slice(0, 50) });
}

import { NextResponse } from "next/server";
import { parseStkCallback, type StkCallbackBody } from "@/lib/mpesa/daraja";
import { applyStkCallback } from "@/lib/mpesa/pending";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StkCallbackBody;
    const parsed = parseStkCallback(body);
    const pending = applyStkCallback(parsed);

    // Always ACK Safaricom quickly — reconciliation is our side-effect.
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
      reconciled: {
        checkoutRequestId: pending.checkoutRequestId,
        status: pending.status,
        receipt: pending.receipt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: "Accepted with parse error",
        error: err instanceof Error ? err.message : "callback error",
      },
      { status: 200 },
    );
  }
}

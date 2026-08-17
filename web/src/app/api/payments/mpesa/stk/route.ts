import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa/daraja";
import { savePendingStk, simulateSuccessfulCallback } from "@/lib/mpesa/pending";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      amount?: number;
      accountReference?: string;
      description?: string;
      policyId?: string;
      policyNumber?: string;
      participantName?: string;
      participantId?: string;
    };

    if (!body.phone || !body.amount || !body.accountReference) {
      return NextResponse.json(
        { error: "phone, amount and accountReference are required" },
        { status: 400 },
      );
    }

    const result = await initiateStkPush({
      phone: body.phone,
      amount: body.amount,
      accountReference: body.accountReference,
      description: body.description,
    });

    const pending = savePendingStk(result, {
      policyId: body.policyId,
      policyNumber: body.policyNumber,
      participantName: body.participantName,
      participantId: body.participantId,
    });

    // Without Daraja credentials, auto-reconcile after ~8s so the desk stays demoable.
    if (result.mode === "sandbox_simulated") {
      setTimeout(() => simulateSuccessfulCallback(result.checkoutRequestId), 8_000);
    }

    return NextResponse.json({ ok: true, ...result, pending });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "STK initiation failed" },
      { status: 500 },
    );
  }
}

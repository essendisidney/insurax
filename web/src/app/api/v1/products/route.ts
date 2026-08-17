import { NextResponse } from "next/server";
import { authenticatePartner, unauthorized } from "@/lib/partners/api_auth";
import { v1ListProducts } from "@/lib/partners/v1_store";

export async function GET(req: Request) {
  const partner = authenticatePartner(req);
  if (!partner) return unauthorized();
  return NextResponse.json({
    partner: { id: partner.partnerId, name: partner.name },
    products: v1ListProducts(),
  });
}

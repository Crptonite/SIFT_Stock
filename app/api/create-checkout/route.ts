import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE } from "@/lib/stripe";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  let userId = "anonymous";
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    userId = d.id;
  } catch { /* allow checkout without auth */ }

  const { type, amount } = await req.json();
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

  let session;
  if (type === "PRO" || type === "ENTERPRISE") {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: type === "PRO" ? STRIPE_PRICE_PRO : STRIPE_PRICE_ENTERPRISE, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?upgraded=1`,
      cancel_url:  `${FRONTEND_URL}/dashboard`,
      metadata: { userId, plan: type },
    });
  } else {
    const cents = Math.round((amount ?? 100) * 100);
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: "sgd", unit_amount: cents,
        product_data: { name: "SIFT Wallet Top-Up" } }, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?topup=1`,
      cancel_url:  `${FRONTEND_URL}/dashboard`,
      metadata: { userId, plan: "TOPUP", amount: String(amount) },
    });
  }
  return NextResponse.json({ url: session.url });
}

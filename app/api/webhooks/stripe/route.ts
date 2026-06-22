import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const exists = await db.processedWebhook.findUnique({ where: { id: session.id } });
    if (exists) return NextResponse.json({ received: true });
    await db.processedWebhook.create({ data: { id: session.id } });

    const { userId, plan, amount } = session.metadata ?? {};
    if (!userId) return NextResponse.json({ received: true });

    if (plan === "TOPUP") {
      const credit = new Decimal(amount ?? "0");
      await db.userProfile.update({ where: { userId }, data: { walletBalance: { increment: credit } } });
      await db.stockTransaction.create({ data: { userId, ticker: "WALLET", type: "TOPUP", totalAmount: credit } });
    } else if (plan === "PRO" || plan === "ENTERPRISE") {
      await db.userProfile.update({ where: { userId }, data: { currentPlan: plan } });
    }
  }
  return NextResponse.json({ received: true });
}

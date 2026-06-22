import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { Decimal } from "@prisma/client/runtime/library";

function getUserId(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    return decoded.id;
  } catch { return null; }
}

async function autoUpgradePlan(userId: string) {
  const agg = await db.stockTransaction.aggregate({
    where: { userId, type: { in: ["BUY", "SELL"] } },
    _sum: { totalAmount: true },
  });
  const vol = Number(agg._sum.totalAmount ?? 0);
  const plan = vol >= 50000 ? "ENTERPRISE" : vol >= 10000 ? "PRO" : null;
  if (plan) await db.userProfile.update({ where: { userId }, data: { currentPlan: plan } });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, ticker, shares, price_per_share, total_amount } = await req.json();
  const amount = new Decimal(total_amount);

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.userProfile.findUniqueOrThrow({ where: { userId } });
      const balance = new Decimal(user.walletBalance);

      if (type === "BUY" && balance.lt(amount)) throw new Error("Insufficient balance");
      if (type === "SELL" && balance.lt(0)) throw new Error("Invalid balance state");

      const newBalance = type === "BUY" ? balance.minus(amount) : balance.plus(amount);
      await tx.userProfile.update({ where: { userId }, data: { walletBalance: newBalance } });

      const transaction = await tx.stockTransaction.create({
        data: { userId, ticker: ticker ?? "WALLET", type, shares: shares ? new Decimal(shares) : null,
                pricePerShare: price_per_share ? new Decimal(price_per_share) : null, totalAmount: amount },
      });
      return { transaction, wallet_balance: newBalance.toString() };
    });

    await autoUpgradePlan(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactions = await db.stockTransaction.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json(transactions);
}

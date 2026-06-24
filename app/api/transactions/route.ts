import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUserId(req: NextRequest): string | null {
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
  if (vol >= 50000) await db.userProfile.update({ where: { userId }, data: { currentPlan: "ENTERPRISE" } });
  else if (vol >= 10000) await db.userProfile.update({ where: { userId }, data: { currentPlan: "PRO" } });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, ticker, shares, price_per_share, total_amount } = await req.json();
  const amount = parseFloat(total_amount);
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.userProfile.findUniqueOrThrow({ where: { userId } });
      const balance = parseFloat(user.walletBalance.toString());
      if (type === "BUY" && balance < amount) throw new Error("Insufficient balance");
      const updated = await tx.userProfile.update({
        where: { userId },
        data: { walletBalance: { [type === "BUY" ? "decrement" : "increment"]: amount } },
      });
      const transaction = await tx.stockTransaction.create({
        data: { userId, ticker: ticker ?? "WALLET", type,
          shares: shares ? parseFloat(shares) : null,
          pricePerShare: price_per_share ? parseFloat(price_per_share) : null,
          totalAmount: amount },
      });
      return { transaction, wallet_balance: updated.walletBalance.toString() };
    });
    await autoUpgradePlan(userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
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

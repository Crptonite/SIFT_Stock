import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const user = await db.userProfile.findUnique({ where: { userId: uid } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ wallet_balance: user.walletBalance.toString(), current_plan: user.currentPlan });
}

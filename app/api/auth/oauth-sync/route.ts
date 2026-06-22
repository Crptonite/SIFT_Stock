import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyStackToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, email, name, image } = await req.json();
    if (!accessToken) return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });

    const stackUser = await verifyStackToken(accessToken);
    const userId = stackUser.id;

    const user = await db.userProfile.upsert({
      where:  { userId },
      create: { userId, email: email ?? stackUser.primary_email, name: name ?? null, image: image ?? null },
      update: { email: email ?? stackUser.primary_email, name: name ?? null, image: image ?? null },
    });

    const token = jwt.sign({ id: userId, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return NextResponse.json({
      id:             user.userId,
      user_id:        user.userId,
      email:          user.email,
      name:           user.name,
      wallet_balance: user.walletBalance.toString(),
      current_plan:   user.currentPlan,
      is_admin:       user.isAdmin,
      token,
    });
  } catch (err: any) {
    console.error("oauth-sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const INVITE_PREFIX = "invite:";

interface InviteCode {
  createdAt: string;
  createdBy: string;
  usedAt?: string;
  usedBy?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      );
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      console.log(`[Redeem] KV not configured. Code: ${normalizedCode}`);
      // In dev without KV, accept any code starting with "TEST"
      if (normalizedCode.startsWith("TEST")) {
        return NextResponse.json({
          success: true,
          message: "Pro access unlocked!",
        });
      }
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    // Look up code in KV
    const invite = await kv.hgetall(`${INVITE_PREFIX}${normalizedCode}`) as InviteCode | null;

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    // Check if already used
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "This code has already been used" },
        { status: 400 }
      );
    }

    // Mark as used
    await kv.hset(`${INVITE_PREFIX}${normalizedCode}`, {
      ...invite,
      usedAt: new Date().toISOString(),
    });

    console.log(`[Redeem] Code redeemed: ${normalizedCode}`);

    return NextResponse.json({
      success: true,
      message: "Pro access unlocked! Enjoy unlimited arbitrage opportunities.",
    });
  } catch (error) {
    console.error("[Redeem] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

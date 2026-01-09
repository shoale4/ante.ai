import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const INVITE_PREFIX = "invite:";
const REDEMPTION_PREFIX = "redemption:";

interface InviteCode {
  createdAt: string;
  createdBy: string;
  usedAt?: string;
  usedBy?: string;
  usedByEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize code and email
    const normalizedCode = code.toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      console.log(`[Redeem] KV not configured. Code: ${normalizedCode}, Email: ${normalizedEmail}`);
      // In dev without KV, accept TEST codes or valid HEDJ format
      if (normalizedCode.startsWith("TEST") || /^HEDJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
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

    // Mark as used with email
    await kv.hset(`${INVITE_PREFIX}${normalizedCode}`, {
      ...invite,
      usedAt: new Date().toISOString(),
      usedBy: normalizedEmail,
      usedByEmail: normalizedEmail,
    });

    // Also create a redemption record for the email (for analytics/lookup)
    await kv.hset(`${REDEMPTION_PREFIX}${normalizedEmail}`, {
      code: normalizedCode,
      redeemedAt: new Date().toISOString(),
    });

    console.log(`[Redeem] Code redeemed: ${normalizedCode} by ${normalizedEmail}`);

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

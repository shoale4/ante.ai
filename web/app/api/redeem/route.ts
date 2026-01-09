import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const INVITE_PREFIX = "invite:";
const REDEMPTION_PREFIX = "redemption:";

interface InviteCode {
  type?: "single" | "promo";
  createdAt: string;
  createdBy: string;
  // Single-use fields
  usedAt?: string;
  usedBy?: string;
  usedByEmail?: string;
  // Promo code fields
  expiresAt?: string;
  maxUses?: number;
  useCount?: number;
  redeemedEmails?: string; // JSON array stored as string
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
      // In dev without KV, accept TEST codes, promo-style codes, or valid HEDJ format
      if (
        normalizedCode.startsWith("TEST") ||
        normalizedCode.startsWith("LAUNCH") ||
        normalizedCode.startsWith("BETA") ||
        /^HEDJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)
      ) {
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

    // Handle promo codes
    if (invite.type === "promo") {
      // Check if expired
      if (invite.expiresAt && new Date(String(invite.expiresAt)) < new Date()) {
        return NextResponse.json(
          { error: "This promo code has expired" },
          { status: 400 }
        );
      }

      // Check if max uses reached (KV returns strings, so parse to int)
      const currentUses = parseInt(String(invite.useCount || 0), 10);
      const maxUses = invite.maxUses ? parseInt(String(invite.maxUses), 10) : null;
      if (maxUses && currentUses >= maxUses) {
        return NextResponse.json(
          { error: "This promo code has reached its maximum uses" },
          { status: 400 }
        );
      }

      // Check if this email already used this promo code
      const redeemedEmails: string[] = invite.redeemedEmails
        ? JSON.parse(String(invite.redeemedEmails))
        : [];

      if (redeemedEmails.includes(normalizedEmail)) {
        // Already redeemed - still success (they have access)
        return NextResponse.json({
          success: true,
          message: "You already have Pro access with this code!",
        });
      }

      // Add email to redeemed list and increment count
      redeemedEmails.push(normalizedEmail);
      await kv.hset(`${INVITE_PREFIX}${normalizedCode}`, {
        type: "promo",
        createdAt: String(invite.createdAt),
        createdBy: String(invite.createdBy),
        useCount: currentUses + 1,
        redeemedEmails: JSON.stringify(redeemedEmails),
        ...(invite.expiresAt && { expiresAt: String(invite.expiresAt) }),
        ...(maxUses && { maxUses }),
      });

      // Create redemption record for this email
      await kv.hset(`${REDEMPTION_PREFIX}${normalizedEmail}`, {
        code: normalizedCode,
        type: "promo",
        redeemedAt: new Date().toISOString(),
      });

      console.log(`[Redeem] Promo code redeemed: ${normalizedCode} by ${normalizedEmail} (use #${currentUses + 1})`);

      return NextResponse.json({
        success: true,
        message: "Pro access unlocked! Enjoy unlimited arbitrage opportunities.",
      });
    }

    // Handle single-use codes (original logic)
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
      type: "single",
      usedAt: new Date().toISOString(),
      usedBy: normalizedEmail,
      usedByEmail: normalizedEmail,
    });

    // Also create a redemption record for the email (for analytics/lookup)
    await kv.hset(`${REDEMPTION_PREFIX}${normalizedEmail}`, {
      code: normalizedCode,
      type: "single",
      redeemedAt: new Date().toISOString(),
    });

    console.log(`[Redeem] Single-use code redeemed: ${normalizedCode} by ${normalizedEmail}`);

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

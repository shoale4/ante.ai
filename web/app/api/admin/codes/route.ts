import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const INVITE_PREFIX = "invite:";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "da-bears";

interface InviteCode {
  type: "single" | "promo";
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

// Generate a random code like "HEDJ-XXXX-XXXX"
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0/O, 1/I
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `HEDJ-${segment()}-${segment()}`;
}

// POST: Create new invite codes (single-use or promo)
export async function POST(request: NextRequest) {
  try {
    // Check admin secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      count = 1,
      createdBy = "admin",
      type = "single",
      // Promo code options
      code: customCode,
      expiresAt,
      maxUses,
    } = body;

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      // Return mock codes for dev
      const mockCodes = type === "promo" && customCode
        ? [customCode.toUpperCase()]
        : Array.from({ length: Math.min(count, 20) }, () => generateCode());
      return NextResponse.json({
        success: true,
        codes: mockCodes,
        note: "KV not configured - these are mock codes",
      });
    }

    // Handle promo code creation
    if (type === "promo") {
      const promoCode = customCode?.toUpperCase() || generateCode();

      // Check if code already exists
      const existing = await kv.hgetall(`${INVITE_PREFIX}${promoCode}`);
      if (existing) {
        return NextResponse.json(
          { error: "Code already exists" },
          { status: 400 }
        );
      }

      const invite: InviteCode = {
        type: "promo",
        createdAt: new Date().toISOString(),
        createdBy,
        expiresAt: expiresAt || undefined,
        maxUses: maxUses || undefined,
        useCount: 0,
        redeemedEmails: JSON.stringify([]),
      };
      await kv.hset(`${INVITE_PREFIX}${promoCode}`, { ...invite });

      console.log(`[Admin] Created promo code ${promoCode} by ${createdBy}`);

      return NextResponse.json({
        success: true,
        codes: [promoCode],
        type: "promo",
        expiresAt,
        maxUses,
      });
    }

    // Handle single-use code creation
    const numCodes = Math.min(Math.max(1, count), 20); // Max 20 at a time
    const codes: string[] = [];

    for (let i = 0; i < numCodes; i++) {
      const code = generateCode();
      const invite: InviteCode = {
        type: "single",
        createdAt: new Date().toISOString(),
        createdBy,
      };
      await kv.hset(`${INVITE_PREFIX}${code}`, { ...invite });
      codes.push(code);
    }

    console.log(`[Admin] Generated ${codes.length} single-use codes by ${createdBy}`);

    return NextResponse.json({
      success: true,
      codes,
      type: "single",
    });
  } catch (error) {
    console.error("[Admin] Error generating codes:", error);
    return NextResponse.json(
      { error: "Failed to generate codes" },
      { status: 500 }
    );
  }
}

// GET: List all codes (for admin)
export async function GET(request: NextRequest) {
  try {
    // Check admin secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({
        codes: [],
        note: "KV not configured",
      });
    }

    // Get all invite keys using keys() - simpler than scan
    const keys = await kv.keys(`${INVITE_PREFIX}*`);

    // Get details for each code
    const codes = await Promise.all(
      keys.map(async (key) => {
        const code = key.replace(INVITE_PREFIX, "");
        const details = await kv.hgetall(key) as InviteCode | null;

        // Determine status based on code type
        let status = "available";
        if (details?.type === "promo") {
          const isExpired = details.expiresAt && new Date(details.expiresAt) < new Date();
          const isMaxedOut = details.maxUses && (details.useCount || 0) >= details.maxUses;
          if (isExpired) status = "expired";
          else if (isMaxedOut) status = "maxed";
          else status = "active";
        } else {
          status = details?.usedAt ? "used" : "available";
        }

        return {
          code,
          ...details,
          status,
          // Parse redeemed emails for display
          redeemedEmailsList: details?.redeemedEmails ? JSON.parse(details.redeemedEmails) : undefined,
        };
      })
    );

    // Sort by creation date (newest first)
    codes.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("[Admin] Error listing codes:", error);
    return NextResponse.json(
      { error: "Failed to list codes" },
      { status: 500 }
    );
  }
}

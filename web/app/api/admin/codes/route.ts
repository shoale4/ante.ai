import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const INVITE_PREFIX = "invite:";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "da-bears";

interface InviteCode {
  createdAt: string;
  createdBy: string;
  usedAt?: string;
  usedBy?: string;
}

// Generate a random code like "HEDJ-XXXX-XXXX"
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0/O, 1/I
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `HEDJ-${segment()}-${segment()}`;
}

// POST: Create new invite codes
export async function POST(request: NextRequest) {
  try {
    // Check admin secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count = 1, createdBy = "admin" } = await request.json().catch(() => ({}));
    const numCodes = Math.min(Math.max(1, count), 20); // Max 20 at a time

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      // Return mock codes for dev
      const mockCodes = Array.from({ length: numCodes }, () => generateCode());
      return NextResponse.json({
        success: true,
        codes: mockCodes,
        note: "KV not configured - these are mock codes",
      });
    }

    const codes: string[] = [];
    for (let i = 0; i < numCodes; i++) {
      const code = generateCode();
      const invite: InviteCode = {
        createdAt: new Date().toISOString(),
        createdBy,
      };
      await kv.hset(`${INVITE_PREFIX}${code}`, { ...invite });
      codes.push(code);
    }

    console.log(`[Admin] Generated ${codes.length} invite codes by ${createdBy}`);

    return NextResponse.json({
      success: true,
      codes,
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
        return {
          code,
          ...details,
          status: details?.usedAt ? "used" : "available",
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

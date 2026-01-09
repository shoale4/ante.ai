import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const WAITLIST_KEY = "waitlist:emails";

interface WaitlistEntry {
  email: string;
  timestamp: string;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, source = "website" } = await request.json();

    // Basic email validation
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      console.log(`[Waitlist] KV not configured. Would add: ${normalizedEmail}`);
      return NextResponse.json(
        { message: "You're on the list! We'll notify you when Pro launches.", success: true },
        { status: 200 }
      );
    }

    // Check for duplicate
    const exists = await kv.sismember(WAITLIST_KEY, normalizedEmail);
    if (exists) {
      return NextResponse.json(
        { message: "You're already on the waitlist!", alreadyExists: true },
        { status: 200 }
      );
    }

    // Add to set (deduped automatically)
    await kv.sadd(WAITLIST_KEY, normalizedEmail);

    // Store full entry with metadata
    const entry: WaitlistEntry = {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      source,
    };
    await kv.hset(`waitlist:entry:${normalizedEmail}`, { ...entry });

    console.log(`[Waitlist] New signup: ${normalizedEmail} from ${source}`);

    return NextResponse.json(
      { message: "You're on the list! We'll notify you when Pro launches.", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Waitlist] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({ count: 0, configured: false });
    }

    const count = await kv.scard(WAITLIST_KEY);
    return NextResponse.json({ count, configured: true });
  } catch (error) {
    console.error("[Waitlist] Error getting count:", error);
    return NextResponse.json({ count: 0, error: true });
  }
}

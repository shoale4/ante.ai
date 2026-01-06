import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

interface WaitlistEntry {
  email: string;
  timestamp: string;
  source: string;
}

async function getWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(WAITLIST_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveWaitlist(entries: WaitlistEntry[]): Promise<void> {
  const dir = path.dirname(WAITLIST_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2));
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

    // Get existing waitlist
    const waitlist = await getWaitlist();

    // Check for duplicate
    if (waitlist.some((entry) => entry.email === normalizedEmail)) {
      return NextResponse.json(
        { message: "You're already on the waitlist!", alreadyExists: true },
        { status: 200 }
      );
    }

    // Add new entry
    waitlist.push({
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      source,
    });

    await saveWaitlist(waitlist);

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
  // Simple endpoint to check waitlist count (could be protected in production)
  try {
    const waitlist = await getWaitlist();
    return NextResponse.json({ count: waitlist.length });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

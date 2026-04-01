import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scans, type NewScan } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const labParam = req.nextUrl.searchParams.get("lab");

  if (labParam === "true") {
    // Only prompt-editors can see lab scans
    const user = await currentUser();
    if (user?.publicMetadata?.role !== "prompt-editor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(scans)
      .where(and(eq(scans.userId, userId), eq(scans.isLab, true)))
      .orderBy(desc(scans.createdAt))
      .limit(20);

    return NextResponse.json(rows);
  }

  const rows = await db
    .select()
    .from(scans)
    .where(and(eq(scans.userId, userId), eq(scans.isLab, false)))
    .orderBy(desc(scans.createdAt))
    .limit(20);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const scan: NewScan = {
    id: body.id,
    userId,
    focusArea: body.focusArea ?? null,
    results: body.results,
    statuses: body.statuses ?? null,
    pipelineSent: body.pipelineSent ?? null,
    isLab: body.isLab ?? false,
    promptVersionId: body.promptVersionId ?? null,
  };

  const [created] = await db.insert(scans).values(scan).returning();
  return NextResponse.json(created, { status: 201 });
}

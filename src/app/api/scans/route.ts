import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scans, type NewScan } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
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
  };

  const [created] = await db.insert(scans).values(scan).returning();
  return NextResponse.json(created, { status: 201 });
}

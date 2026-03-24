import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updates: Partial<typeof scans.$inferInsert> = {};
  if (body.statuses !== undefined) updates.statuses = body.statuses;
  if (body.pipelineSent !== undefined) updates.pipelineSent = body.pipelineSent;

  const [updated] = await db
    .update(scans)
    .set(updates)
    .where(and(eq(scans.id, id), eq(scans.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

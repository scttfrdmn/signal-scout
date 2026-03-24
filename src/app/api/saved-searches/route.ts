import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { savedSearches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.savedSearches.findMany({
    where: eq(savedSearches.userId, userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.focusArea) {
    return NextResponse.json({ error: "name and focusArea are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(savedSearches)
    .values({ id: uid(), userId, name: body.name.trim(), focusArea: body.focusArea.trim() })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

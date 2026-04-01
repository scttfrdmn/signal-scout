import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { promptVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const updated = await db.transaction(async (tx) => {
    const [target] = await tx.select().from(promptVersions).where(eq(promptVersions.id, id));
    if (!target) throw new Error("NOT_FOUND");

    // Archive current active (if any)
    await tx
      .update(promptVersions)
      .set({ status: "archived" })
      .where(eq(promptVersions.status, "active"));

    // Activate target
    const [activated] = await tx
      .update(promptVersions)
      .set({ status: "active", activatedAt: new Date() })
      .where(eq(promptVersions.id, id))
      .returning();

    return activated;
  });

  return NextResponse.json(updated);
}

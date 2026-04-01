import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { promptVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [row] = await db.select().from(promptVersions).where(eq(promptVersions.id, id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [existing] = await db.select().from(promptVersions).where(eq(promptVersions.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft versions can be edited" }, { status: 409 });
  }

  const body = await req.json();
  const updates: Partial<typeof existing> = {};

  if (body.label !== undefined) updates.label = body.label;
  if (body.body !== undefined) {
    if (!body.body.includes("{{CUTOFF_DATE}}") || !body.body.includes("{{FOCUS_AREA_INSTRUCTION}}")) {
      return NextResponse.json(
        { error: "body must contain {{CUTOFF_DATE}} and {{FOCUS_AREA_INSTRUCTION}} placeholders" },
        { status: 400 }
      );
    }
    updates.body = body.body;
  }
  if (body.focusAreaInstruction !== undefined) {
    if (!body.focusAreaInstruction.includes("{{FOCUS_AREA}}")) {
      return NextResponse.json(
        { error: "focusAreaInstruction must contain {{FOCUS_AREA}} placeholder" },
        { status: 400 }
      );
    }
    updates.focusAreaInstruction = body.focusAreaInstruction;
  }

  const [updated] = await db
    .update(promptVersions)
    .set(updates)
    .where(eq(promptVersions.id, id))
    .returning();

  return NextResponse.json(updated);
}

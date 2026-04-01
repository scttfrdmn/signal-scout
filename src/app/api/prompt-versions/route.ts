import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { promptVersions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureActivePromptVersion } from "@/lib/db/seed-prompt";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureActivePromptVersion(userId);

  const rows = await db
    .select()
    .from(promptVersions)
    .orderBy(desc(promptVersions.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { label, body: promptBody, focusAreaInstruction } = body;

  if (!promptBody || !focusAreaInstruction) {
    return NextResponse.json({ error: "body and focusAreaInstruction are required" }, { status: 400 });
  }
  if (!promptBody.includes("{{CUTOFF_DATE}}") || !promptBody.includes("{{FOCUS_AREA_INSTRUCTION}}")) {
    return NextResponse.json(
      { error: "body must contain {{CUTOFF_DATE}} and {{FOCUS_AREA_INSTRUCTION}} placeholders" },
      { status: 400 }
    );
  }
  if (!focusAreaInstruction.includes("{{FOCUS_AREA}}")) {
    return NextResponse.json(
      { error: "focusAreaInstruction must contain {{FOCUS_AREA}} placeholder" },
      { status: 400 }
    );
  }

  const id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

  const [created] = await db
    .insert(promptVersions)
    .values({ id, label: label ?? null, body: promptBody, focusAreaInstruction, status: "draft", createdBy: user.id })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

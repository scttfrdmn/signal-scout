import { eq } from "drizzle-orm";
import { db } from "./index";
import { promptVersions } from "./schema";
import { SEED_PROMPT_BODY, SEED_FOCUS_AREA_INSTRUCTION } from "../anthropic/prompt";

export async function ensureActivePromptVersion(userId: string): Promise<void> {
  const existing = await db
    .select({ id: promptVersions.id })
    .from(promptVersions)
    .where(eq(promptVersions.status, "active"))
    .limit(1);

  if (existing.length > 0) return;

  const id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

  await db.insert(promptVersions).values({
    id,
    label: "Initial prompt (auto-seeded)",
    body: SEED_PROMPT_BODY,
    focusAreaInstruction: SEED_FOCUS_AREA_INSTRUCTION,
    status: "active",
    createdBy: userId,
    activatedAt: new Date(),
  });
}

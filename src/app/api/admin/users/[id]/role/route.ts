import { NextRequest, NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const role: "prompt-editor" | null = body.role ?? null;

  const client = await clerkClient();
  await client.users.updateUserMetadata(id, {
    publicMetadata: { role: role ?? "" },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.publicMetadata?.role !== "prompt-editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });

  const result = users.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.emailAddresses[0]?.emailAddress,
    email: u.emailAddresses[0]?.emailAddress ?? "",
    role: (u.publicMetadata?.role as string) ?? null,
  }));

  return NextResponse.json(result);
}

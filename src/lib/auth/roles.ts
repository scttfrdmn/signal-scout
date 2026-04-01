import { currentUser } from "@clerk/nextjs/server";

export async function isPromptEditor(): Promise<boolean> {
  const user = await currentUser();
  return user?.publicMetadata?.role === "prompt-editor";
}

export async function requirePromptEditor(): Promise<void> {
  const allowed = await isPromptEditor();
  if (!allowed) {
    throw new Response("Forbidden", { status: 403 });
  }
}

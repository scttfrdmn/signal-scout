import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LabClient from "./LabClient";

export default async function LabPage() {
  const user = await currentUser();
  if (user?.publicMetadata?.role !== "prompt-editor") {
    redirect("/");
  }
  return <LabClient />;
}

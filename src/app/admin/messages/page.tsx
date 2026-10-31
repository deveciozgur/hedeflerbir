import type { Metadata } from "next";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { MessagesScreen } from "@/modules/messaging/ui/messages-screen";

export const metadata: Metadata = { title: "Mesaj Denetimi" };

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const [{ scope }, viewer] = await Promise.all([searchParams, getViewer("ADMIN")]);
  return <MessagesScreen viewer={viewer} scope={scope === "all" ? "all" : "mine"} />;
}

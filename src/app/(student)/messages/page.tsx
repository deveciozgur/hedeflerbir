import type { Metadata } from "next";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { MessagesScreen } from "@/modules/messaging/ui/messages-screen";

export const metadata: Metadata = { title: "Mesajlar" };

export default async function MessagesPage() {
  const viewer = await getViewer("STUDENT");
  return <MessagesScreen viewer={viewer} />;
}

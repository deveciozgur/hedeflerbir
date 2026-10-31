import type { Metadata } from "next";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { MessagesScreen } from "@/modules/messaging/ui/messages-screen";

export const metadata: Metadata = { title: "Mesajlar" };

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const [{ threadId }, viewer] = await Promise.all([params, getViewer("MENTOR")]);
  return <MessagesScreen viewer={viewer} threadId={threadId} />;
}

import type { Metadata } from "next";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { MessagesScreen } from "@/modules/messaging/ui/messages-screen";

export const metadata: Metadata = { title: "Mesaj Denetimi" };

interface PageProps {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ scope?: string }>;
}

export default async function AdminThreadPage({ params, searchParams }: PageProps) {
  const [{ threadId }, { scope }, viewer] = await Promise.all([params, searchParams, getViewer("ADMIN")]);
  return <MessagesScreen viewer={viewer} threadId={threadId} scope={scope === "all" ? "all" : "mine"} />;
}

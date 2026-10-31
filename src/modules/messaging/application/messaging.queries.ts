import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import type { Role } from "@/modules/identity/domain/role";
import { allowedRecipientRoles } from "../domain/contact-policy";
import { counterpartId, isParticipant, previewOf } from "../domain/thread";

const THREAD_LIMIT = 100;

const personSelect = { id: true, name: true, surname: true, role: true, avatarUrl: true } as const;

export interface Person {
  id: string;
  name: string;
  surname: string;
  role: Role;
  avatarUrl: string | null;
}

export interface ThreadSummary {
  id: string;
  subject: string;
  preview: string;
  lastAt: Date;
  unread: number;
  /** For a participant: the other person. For admin oversight: both participants. */
  people: Person[];
}

const threadSummarySelect = (unreadFor: string | null) =>
  ({
    id: true,
    subject: true,
    content: true,
    createdAt: true,
    senderId: true,
    receiverId: true,
    readAt: true,
    sender: { select: personSelect },
    receiver: { select: personSelect },
    replies: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, createdAt: true } },
    _count: { select: { replies: { where: { receiverId: unreadFor ?? "", readAt: null } } } },
  }) as const;

/** The viewer's own conversations, most recent activity first. */
export async function listThreads(userId: string): Promise<ThreadSummary[]> {
  const roots = await db.message.findMany({
    where: { parentId: null, OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    take: THREAD_LIMIT,
    select: threadSummarySelect(userId),
  });

  return roots
    .map((root) => {
      const last = root.replies[0];
      const rootUnread = root.receiverId === userId && root.readAt === null ? 1 : 0;
      return {
        id: root.id,
        subject: root.subject,
        preview: previewOf(last?.content ?? root.content),
        lastAt: last?.createdAt ?? root.createdAt,
        unread: rootUnread + root._count.replies,
        people: [counterpartId(root, userId) === root.senderId ? root.sender : root.receiver],
      };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

/** Admin oversight: every conversation on the platform (read-only, no unread state). */
export async function listAllThreads(): Promise<ThreadSummary[]> {
  const roots = await db.message.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "desc" },
    take: THREAD_LIMIT,
    select: threadSummarySelect(null),
  });

  return roots
    .map((root) => {
      const last = root.replies[0];
      return {
        id: root.id,
        subject: root.subject,
        preview: previewOf(last?.content ?? root.content),
        lastAt: last?.createdAt ?? root.createdAt,
        unread: 0,
        people: [root.sender, root.receiver],
      };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface ThreadDetail {
  id: string;
  subject: string;
  participants: [Person, Person];
  messages: ThreadMessage[];
  hasUnread: boolean;
}

async function loadThread(threadId: string) {
  return db.message.findFirst({
    where: { id: threadId, parentId: null },
    select: {
      id: true,
      subject: true,
      senderId: true,
      receiverId: true,
      content: true,
      createdAt: true,
      readAt: true,
      sender: { select: personSelect },
      receiver: { select: personSelect },
      replies: {
        orderBy: { createdAt: "asc" },
        select: { id: true, senderId: true, receiverId: true, content: true, createdAt: true, readAt: true },
      },
    },
  });
}

/**
 * @param viewerId participant whose unread state is computed; `null` for admin oversight.
 */
export async function getThread(threadId: string, viewerId: string | null): Promise<ThreadDetail> {
  const root = await loadThread(threadId);
  if (!root || (viewerId !== null && !isParticipant(root, viewerId))) notFound();

  const all = [
    { id: root.id, senderId: root.senderId, receiverId: root.receiverId, content: root.content, createdAt: root.createdAt, readAt: root.readAt },
    ...root.replies,
  ];

  return {
    id: root.id,
    subject: root.subject,
    participants: [root.sender, root.receiver],
    messages: all.map((m) => ({ id: m.id, senderId: m.senderId, content: m.content, createdAt: m.createdAt, readAt: m.readAt })),
    hasUnread: viewerId !== null && all.some((m) => m.receiverId === viewerId && m.readAt === null),
  };
}

export interface Contact extends Person {
  title: string | null;
}

/** People the viewer is allowed to start a conversation with. */
export async function listContacts(viewer: { id: string; role: Role }): Promise<Contact[]> {
  const users = await db.user.findMany({
    where: { id: { not: viewer.id }, isActive: true, role: { in: [...allowedRecipientRoles(viewer.role)] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 500,
    select: { ...personSelect, profile: { select: { title: true } } },
  });
  return users.map(({ profile, ...user }) => ({ ...user, title: profile?.title ?? null }));
}

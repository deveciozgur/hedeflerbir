/**
 * A conversation is a root message (parentId = null) plus its replies (parentId = root.id).
 * Its two participants are fixed by the root's sender and receiver.
 */

export interface ThreadParticipants {
  senderId: string;
  receiverId: string;
}

export const isParticipant = (root: ThreadParticipants, userId: string) =>
  root.senderId === userId || root.receiverId === userId;

export function counterpartId(root: ThreadParticipants, userId: string): string {
  if (!isParticipant(root, userId)) throw new Error("User is not a participant of this thread.");
  return root.senderId === userId ? root.receiverId : root.senderId;
}

export const previewOf = (content: string, max = 120) => {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

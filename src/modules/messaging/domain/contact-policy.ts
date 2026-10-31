import type { Role } from "@/modules/identity/domain/role";

/**
 * Who may open a conversation with whom. Students reach experts and admins but not each other;
 * experts and admins can reach everyone.
 */
const ALLOWED_RECIPIENTS: Record<Role, readonly Role[]> = {
  STUDENT: ["INSTRUCTOR", "MENTOR", "ADMIN"],
  INSTRUCTOR: ["STUDENT", "INSTRUCTOR", "MENTOR", "ADMIN"],
  MENTOR: ["STUDENT", "INSTRUCTOR", "MENTOR", "ADMIN"],
  ADMIN: ["STUDENT", "INSTRUCTOR", "MENTOR", "ADMIN"],
};

export const allowedRecipientRoles = (sender: Role): readonly Role[] => ALLOWED_RECIPIENTS[sender];

export const canMessage = (sender: Role, recipient: Role): boolean => ALLOWED_RECIPIENTS[sender].includes(recipient);

/** Each role's inbox lives inside its own area. */
export const MESSAGES_PATH: Record<Role, string> = {
  STUDENT: "/messages",
  INSTRUCTOR: "/instructor/messages",
  MENTOR: "/mentor/messages",
  ADMIN: "/admin/messages",
};

export const threadPath = (role: Role, threadId: string) => `${MESSAGES_PATH[role]}/${threadId}`;

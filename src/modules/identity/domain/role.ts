/**
 * Edge-safe mirror of the Prisma `Role` enum.
 * Kept framework-free so middleware and domain policies never import the Prisma client.
 */
export const ROLES = ["STUDENT", "INSTRUCTOR", "MENTOR", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Katılımcı",
  INSTRUCTOR: "Eğitmen",
  MENTOR: "Mentor",
  ADMIN: "Yönetici",
};

/** Login portals. Experts (instructor & mentor) share a single entry point. */
export type Portal = "student" | "expert";

const PORTAL_ROLES: Record<Portal, readonly Role[]> = {
  student: ["STUDENT", "ADMIN"],
  expert: ["INSTRUCTOR", "MENTOR"],
};

export const PORTAL_LOGIN_PATH: Record<Portal, string> = {
  student: "/login",
  expert: "/expert-login",
};

export const canUsePortal = (role: Role, portal: Portal): boolean => PORTAL_ROLES[portal].includes(role);

export const portalFor = (role: Role): Portal => (PORTAL_ROLES.expert.includes(role) ? "expert" : "student");

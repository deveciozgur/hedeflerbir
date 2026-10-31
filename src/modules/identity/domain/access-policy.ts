import { PORTAL_LOGIN_PATH, type Portal, type Role } from "./role";

/**
 * Route-level RBAC. Pure function — consumed by middleware (edge) and server guards (node).
 */

interface AreaPolicy {
  prefixes: readonly string[];
  roles: readonly Role[];
  portal: Portal;
  home: string;
}

const AREAS = {
  student: {
    prefixes: ["/dashboard", "/trainings", "/courses", "/assignments", "/team", "/profile", "/instructors", "/mentors", "/messages"],
    roles: ["STUDENT"],
    portal: "student",
    home: "/dashboard",
  },
  instructor: { prefixes: ["/instructor"], roles: ["INSTRUCTOR"], portal: "expert", home: "/instructor" },
  mentor: { prefixes: ["/mentor"], roles: ["MENTOR"], portal: "expert", home: "/mentor" },
  admin: { prefixes: ["/admin"], roles: ["ADMIN"], portal: "student", home: "/admin" },
} as const satisfies Record<string, AreaPolicy>;

export type Area = keyof typeof AREAS;

const HOME_BY_ROLE: Record<Role, string> = {
  STUDENT: AREAS.student.home,
  INSTRUCTOR: AREAS.instructor.home,
  MENTOR: AREAS.mentor.home,
  ADMIN: AREAS.admin.home,
};

/** Smart dynamic routing: where a role lands after authentication. */
export const homeFor = (role: Role): string => HOME_BY_ROLE[role];

const AUTH_PAGES = new Set(Object.values(PORTAL_LOGIN_PATH));

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const findArea = (pathname: string): AreaPolicy | undefined =>
  Object.values(AREAS).find((area: AreaPolicy) => area.prefixes.some((p) => matchesPrefix(pathname, p)));

export type AccessDecision = { type: "allow" } | { type: "redirect"; to: string };

const allow: AccessDecision = { type: "allow" };
const redirect = (to: string): AccessDecision => ({ type: "redirect", to });

export function resolveAccess(pathname: string, role: Role | undefined): AccessDecision {
  if (AUTH_PAGES.has(pathname)) return role ? redirect(homeFor(role)) : allow;
  if (pathname === "/") return redirect(role ? homeFor(role) : PORTAL_LOGIN_PATH.student);

  const area = findArea(pathname);
  if (!area) return allow;

  if (!role) {
    const login = PORTAL_LOGIN_PATH[area.portal];
    return redirect(`${login}?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return area.roles.includes(role) ? allow : redirect(homeFor(role));
}

export const canAccessArea = (area: Area, role: Role): boolean =>
  (AREAS[area].roles as readonly Role[]).includes(role);

import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ShellVariant = "student" | "instructor" | "mentor" | "admin";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Match only the exact path (for area roots such as /admin). */
  exact?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const NAVIGATION: Record<ShellVariant, NavSection[]> = {
  student: [
    {
      items: [
        { title: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
        { title: "Eğitimler", href: "/trainings", icon: CalendarDays },
        { title: "Ödevler", href: "/assignments", icon: ClipboardCheck },
      ],
    },
    {
      label: "Topluluk",
      items: [
        { title: "Ekibim", href: "/team", icon: Users },
        { title: "Eğitmenler", href: "/instructors", icon: GraduationCap },
        { title: "Mentorlar", href: "/mentors", icon: Sparkles },
        { title: "Mesajlar", href: "/messages", icon: MessagesSquare },
      ],
    },
    { label: "Hesap", items: [{ title: "Profilim", href: "/profile", icon: UserRound }] },
  ],
  instructor: [
    {
      items: [
        { title: "Genel Bakış", href: "/instructor", icon: LayoutDashboard, exact: true },
        { title: "Eğitimlerim", href: "/instructor/courses", icon: BookOpen },
        { title: "Ödev & Puanlama", href: "/instructor/assignments", icon: ClipboardCheck },
        { title: "Katılımcılar", href: "/instructor/students", icon: Users },
      ],
    },
    {
      label: "Hesap",
      items: [
        { title: "Mesajlar", href: "/instructor/messages", icon: MessagesSquare },
        { title: "Eğitmen Profili", href: "/instructor/profile", icon: UserRound },
      ],
    },
  ],
  mentor: [
    {
      items: [
        { title: "Genel Bakış", href: "/mentor", icon: LayoutDashboard, exact: true },
        { title: "Müsaitlik", href: "/mentor/availability", icon: CalendarDays },
        { title: "Randevular", href: "/mentor/appointments", icon: CalendarClock },
      ],
    },
    {
      label: "Hesap",
      items: [
        { title: "Mesajlar", href: "/mentor/messages", icon: MessagesSquare },
        { title: "Mentor Profili", href: "/mentor/profile", icon: UserRound },
      ],
    },
  ],
  admin: [
    {
      items: [
        { title: "Ana Sayfa", href: "/admin", icon: LayoutDashboard, exact: true },
        { title: "Kullanıcılar", href: "/admin/users", icon: Users },
        { title: "Katılımcılar", href: "/admin/participants", icon: UserRound },
        { title: "Eğitimler", href: "/admin/trainings", icon: CalendarDays },
        { title: "Mentorlar", href: "/admin/mentors", icon: Sparkles },
        { title: "Programlar", href: "/admin/courses", icon: BookOpen },
        { title: "Raporlar", href: "/admin/reports", icon: BarChart3 },
        { title: "Denetim Kayıtları", href: "/admin/audit", icon: ShieldCheck },
      ],
    },
    {
      label: "İletişim",
      items: [
        { title: "Mesajlar", href: "/admin/messages", icon: Inbox },
        { title: "Destek Masası", href: "/admin/support", icon: LifeBuoy },
      ],
    },
  ],
};

export const SHELL_LABEL: Record<ShellVariant, string> = {
  student: "Katılımcı",
  instructor: "Eğitmen Portalı",
  mentor: "Mentor Portalı",
  admin: "Kontrol Merkezi",
};

export const PROFILE_HREF: Record<ShellVariant, string> = {
  student: "/profile",
  instructor: "/instructor/profile",
  mentor: "/mentor/profile",
  admin: "/admin/profile",
};

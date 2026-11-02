import { redirect } from "next/navigation";

/** "Programlar" was removed: the bootcamp is one programme and trainings are managed directly. */
export default function AdminCourseDetailPage() {
  redirect("/admin/trainings");
}

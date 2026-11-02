import { redirect } from "next/navigation";

/** Mentor calendars are admin-only now; old links land on the mentor cards. */
export default function MentorDetailPage() {
  redirect("/mentors");
}

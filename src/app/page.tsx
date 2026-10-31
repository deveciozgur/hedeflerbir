import { redirect } from "next/navigation";

// Authenticated visitors are routed to their role home by middleware before reaching this.
export default function RootPage() {
  redirect("/login");
}

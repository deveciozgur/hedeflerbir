import type { Metadata } from "next";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { ExpertProfileScreen } from "@/modules/identity/ui/expert-profile-screen";

export const metadata: Metadata = { title: "Eğitmen Profili" };

export default async function ProfilePage() {
  const viewer = await getViewer("INSTRUCTOR");
  return <ExpertProfileScreen viewer={viewer} />;
}

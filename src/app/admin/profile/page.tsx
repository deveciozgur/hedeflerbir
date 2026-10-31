import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { AvatarUploader } from "@/modules/identity/ui/avatar-uploader";
import { PasswordForm } from "@/modules/identity/ui/password-form";
import { AdminProfileForm } from "@/modules/identity/ui/profile-forms";

export const metadata: Metadata = { title: "Profil" };

export default async function AdminProfilePage() {
  const viewer = await getViewer("ADMIN");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Profil" description={viewer.email} />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <AvatarUploader user={viewer} />
            </CardContent>
          </Card>
          <AdminProfileForm defaults={{ name: viewer.name, surname: viewer.surname }} />
        </div>
        <PasswordForm />
      </div>
    </div>
  );
}

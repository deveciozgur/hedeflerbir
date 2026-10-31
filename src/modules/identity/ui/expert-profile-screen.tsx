import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fullName } from "@/lib/utils";
import { getOwnProfile } from "../application/profile.queries";
import type { Viewer } from "../application/viewer.queries";
import { parseSocialLinks } from "../domain/profile";
import { AvatarUploader } from "./avatar-uploader";
import { PasswordForm } from "./password-form";
import { ExpertProfileForm } from "./profile-forms";

/** Shared by /instructor/profile and /mentor/profile: editor + a preview of what students see. */
export async function ExpertProfileScreen({ viewer }: { viewer: Viewer }) {
  const profile = await getOwnProfile(viewer.id);
  const isMentor = viewer.role === "MENTOR";
  const links = parseSocialLinks(profile.socialLinks);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={isMentor ? "Mentor Profili" : "Eğitmen Profili"}
        description="Bio, uzmanlık alanı ve sosyal bağlantılarını düzenle."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <AvatarUploader user={profile} />
            </CardContent>
          </Card>
          <ExpertProfileForm
            isMentor={isMentor}
            defaults={{
              name: profile.name,
              surname: profile.surname,
              bio: profile.bio,
              title: profile.title,
              expertiseArea: profile.expertiseArea,
              socialLinks: profile.socialLinks,
            }}
          />
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Önizleme</CardTitle>
                <CardDescription>Katılımcılar seni böyle görür (kaydettikten sonra güncellenir).</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={profile} className="size-12" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName(profile)}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.title || "Unvan eklenmedi"}</p>
                </div>
              </div>
              {profile.expertiseArea ? <Badge variant="secondary">{profile.expertiseArea}</Badge> : null}
              <p className="line-clamp-4 text-sm text-muted-foreground">{profile.bio || "Henüz biyografi eklemedin."}</p>
              {links.length > 0 ? (
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {links.map((link) => (
                    <li key={link.network} className="inline-flex items-center gap-1 text-muted-foreground">
                      <ExternalLink className="size-3" aria-hidden /> {link.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}

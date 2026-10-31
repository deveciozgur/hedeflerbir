import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { getViewer } from "@/modules/identity/application/viewer.queries";
import { ROLE_LABELS, ROLES } from "@/modules/identity/domain/role";
import { listUsers } from "@/modules/administration/application/user-admin.queries";
import { CreateUserDialog } from "@/modules/administration/ui/create-user-dialog";
import { ImportUsersDialog } from "@/modules/administration/ui/import-users-dialog";
import { ActivationButton, RoleSelect } from "@/modules/administration/ui/user-row-controls";

export const metadata: Metadata = { title: "Kullanıcılar" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const [filters, viewer] = await Promise.all([searchParams, getViewer("ADMIN")]);
  const { users, counts } = await listUsers(filters);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kullanıcılar"
        description={`${total} hesap · ${ROLES.map((r) => `${counts[r]} ${ROLE_LABELS[r].toLocaleLowerCase("tr-TR")}`).join(" · ")}`}
        actions={
          <div className="flex gap-2">
            <ImportUsersDialog />
            <CreateUserDialog />
          </div>
        }
      />

      <form role="search" className="flex flex-col gap-2 sm:flex-row" action="/admin/users">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={filters.q} placeholder="Ad, soyad veya e-posta ara…" aria-label="Kullanıcı ara" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <NativeSelect name="role" defaultValue={filters.role ?? ""} aria-label="Role göre filtrele" className="w-40">
            <option value="">Tüm roller</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline">
            Filtrele
          </Button>
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Kullanıcı bulunamadı" description="Arama ölçütlerini değiştirip tekrar deneyin." />
      ) : (
        <Card className="gap-0 overflow-x-auto py-0">
          <table className="w-full min-w-[44rem] text-sm">
            <caption className="sr-only">Kullanıcı listesi</caption>
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Kullanıcı</th>
                <th scope="col" className="px-3 py-3 font-medium">Rol</th>
                <th scope="col" className="px-3 py-3 font-medium">Durum</th>
                <th scope="col" className="px-3 py-3 font-medium">Kayıt</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">İşlemler</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const isSelf = user.id === viewer.id;
                return (
                  <tr key={user.id} className={user.isActive ? undefined : "bg-muted/30"}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {fullName(user)}
                            {isSelf ? <span className="font-normal text-muted-foreground"> (siz)</span> : null}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <RoleSelect userId={user.id} userName={fullName(user)} role={user.role} isSelf={isSelf} />
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={user.isActive ? "success" : "outline"}>{user.isActive ? "Aktif" : "Askıda"}</Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <ActivationButton userId={user.id} userName={fullName(user)} isActive={user.isActive} isSelf={isSelf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

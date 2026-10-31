"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { enrollStudentsAction, unenrollStudentAction } from "../application/course-admin.actions";
import type { PersonOption } from "../application/course-admin.queries";

const matches = (person: PersonOption, term: string) =>
  `${fullName(person)} ${person.email}`.toLocaleLowerCase("tr-TR").includes(term.toLocaleLowerCase("tr-TR"));

interface EnrollmentManagerProps {
  courseId: string;
  courseTitle: string;
  enrolled: Array<PersonOption & { enrolledAt: Date }>;
  candidates: PersonOption[];
}

export function EnrollmentManager({ courseId, courseTitle, enrolled, candidates }: EnrollmentManagerProps) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const visible = useMemo(() => (search.trim() ? candidates.filter((c) => matches(c, search.trim())) : candidates), [candidates, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const enroll = () =>
    startTransition(async () => {
      const result = await enrollStudentsAction({ courseId, studentIds: [...selected] });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.added} katılımcı kaydedildi`, { description: "Katılımcılara bildirim gönderildi." });
      setSelected(new Set());
      setSearch("");
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Kayıtlı katılımcılar</CardTitle>
            <CardDescription>{enrolled.length} kişi</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {enrolled.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Henüz kayıtlı katılımcı yok.
            </p>
          ) : (
            <ul className="flex max-h-[28rem] flex-col divide-y overflow-y-auto rounded-lg border">
              {enrolled.map((student) => (
                <li key={student.id} className="flex items-center gap-3 px-3 py-2">
                  <UserAvatar user={student} className="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{fullName(student)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {student.email} · {formatDate(student.enrolledAt)}
                    </span>
                  </span>
                  <ConfirmActionButton
                    variant="ghost"
                    label={
                      <>
                        <UserMinus aria-hidden />
                        <span className="sr-only">{fullName(student)} kaydını sil</span>
                      </>
                    }
                    title="Kaydı sil"
                    description={`${fullName(student)}, "${courseTitle}" eğitiminden çıkarılacak. Teslimleri ve devam kayıtları raporlar için saklanır.`}
                    confirmLabel="Kaydı sil"
                    successMessage="Kayıt silindi"
                    destructive
                    action={() => unenrollStudentAction(courseId, student.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Katılımcı ekle</CardTitle>
            <CardDescription>Seçilen katılımcılar eğitime kaydedilir ve bildirim alır.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad veya e-posta ara…" aria-label="Katılımcı ara" className="pl-9" />
          </div>
          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {candidates.length === 0 ? "Kaydedilebilecek aktif katılımcı yok." : "Sonuç bulunamadı."}
            </p>
          ) : (
            <fieldset className="max-h-80 overflow-y-auto rounded-lg border">
              <legend className="sr-only">Eklenecek katılımcılar</legend>
              {visible.map((candidate) => (
                <label key={candidate.id} className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-accent/50">
                  <input
                    type="checkbox"
                    checked={selected.has(candidate.id)}
                    onChange={() => toggle(candidate.id)}
                    className="size-4 accent-[var(--brand)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{fullName(candidate)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{candidate.email}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <Button onClick={enroll} disabled={selected.size === 0 || pending} className="self-start">
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}
            {selected.size > 0 ? `${selected.size} katılımcıyı kaydet` : "Katılımcı seçin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

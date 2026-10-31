"use client";

import { useId, useOptimistic, useRef, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { removeAvatarAction, uploadAvatarAction } from "../application/profile.actions";
import { AVATAR_ACCEPT, validateAvatar } from "../domain/avatar-policy";

interface AvatarUploaderProps {
  user: { name: string; surname: string; avatarUrl: string | null };
}

export function AvatarUploader({ user }: AvatarUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [avatarUrl, setOptimisticUrl] = useOptimistic(user.avatarUrl);

  const upload = (file: File) => {
    const check = validateAvatar(file);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    const preview = URL.createObjectURL(file);
    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      setOptimisticUrl(preview);
      const result = await uploadAvatarAction(formData);
      URL.revokeObjectURL(preview);
      if (result.ok) toast.success("Profil fotoğrafı güncellendi");
      else toast.error(result.error);
    });
  };

  const remove = () =>
    startTransition(async () => {
      setOptimisticUrl(null);
      const result = await removeAvatarAction();
      if (result.ok) toast.success("Profil fotoğrafı kaldırıldı");
      else toast.error(result.error);
    });

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar user={{ ...user, avatarUrl }} className="size-20" />
        {pending ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-background/60" aria-hidden>
            <Loader2 className="size-5 animate-spin" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
            <Camera aria-hidden /> {avatarUrl ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}
          </Button>
          {avatarUrl ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
              <Trash2 aria-hidden /> Kaldır
            </Button>
          ) : null}
        </div>
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          PNG, JPG veya WEBP · en fazla 2 MB
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
    </div>
  );
}

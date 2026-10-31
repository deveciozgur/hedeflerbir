"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ROLE_LABELS, ROLES } from "@/modules/identity/domain/role";
import { createUserAction } from "../application/user-admin.actions";
import { createUserSchema, type CreateUserInput } from "../domain/user-admin";

const DEFAULTS: CreateUserInput = { name: "", surname: "", email: "", role: "STUDENT" };

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: DEFAULTS });

  const close = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) {
      reset(DEFAULTS);
      setCreated(null);
      setCopied(false);
    }
  };

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await createUserAction(values);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof CreateUserInput, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      setCreated({ email: values.email, password: result.data.temporaryPassword });
    }),
  );

  const copy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.password);
    setCopied(true);
  };

  const a11y = (field: keyof CreateUserInput) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-message` : undefined,
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden /> Kullanıcı ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Hesap oluşturuldu</DialogTitle>
              <DialogDescription>
                Geçici şifreyi kullanıcıyla güvenli bir kanaldan paylaşın. Bu şifre bir daha gösterilmeyecek.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">{created.email}</p>
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <code className="flex-1 font-mono text-base tracking-wider select-all">{created.password}</code>
                <Button variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>Tamam</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Yeni kullanıcı</DialogTitle>
              <DialogDescription>Hesap geçici bir şifreyle oluşturulur.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField id="name" label="Ad" error={errors.name?.message}>
                  <Input id="name" autoComplete="off" {...a11y("name")} {...register("name")} />
                </FormField>
                <FormField id="surname" label="Soyad" error={errors.surname?.message}>
                  <Input id="surname" autoComplete="off" {...a11y("surname")} {...register("surname")} />
                </FormField>
              </div>
              <FormField id="email" label="E-posta" error={errors.email?.message}>
                <Input id="email" type="email" autoComplete="off" {...a11y("email")} {...register("email")} />
              </FormField>
              <FormField id="role" label="Rol" error={errors.role?.message}>
                <NativeSelect id="role" {...a11y("role")} {...register("role")}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={pending}>
                    Vazgeç
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

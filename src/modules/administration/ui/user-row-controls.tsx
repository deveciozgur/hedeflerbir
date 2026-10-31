"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ROLE_LABELS, ROLES, type Role } from "@/modules/identity/domain/role";
import { changeRoleAction, setUserActiveAction } from "../application/user-admin.actions";

interface UserRowControlsProps {
  userId: string;
  userName: string;
  role: Role;
  isActive: boolean;
  isSelf: boolean;
}

/** Inline role assignment + suspend/reactivate, with optimistic UI that reverts on server rejection. */
export function RoleSelect({ userId, userName, role, isSelf }: Omit<UserRowControlsProps, "isActive">) {
  const [pending, startTransition] = useTransition();
  const [optimisticRole, setOptimisticRole] = useOptimistic(role);

  return (
    <NativeSelect
      aria-label={`${userName} rolü`}
      value={optimisticRole}
      disabled={pending || isSelf}
      className="h-8 w-36 text-xs"
      onChange={(event) => {
        const next = event.target.value as Role;
        startTransition(async () => {
          setOptimisticRole(next);
          const result = await changeRoleAction({ userId, role: next });
          if (result.ok) toast.success(`${userName} artık ${ROLE_LABELS[next]}`);
          else toast.error(result.error);
        });
      }}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </NativeSelect>
  );
}

export function ActivationButton({ userId, userName, isActive, isSelf }: Omit<UserRowControlsProps, "role">) {
  const [pending, startTransition] = useTransition();
  const [optimisticActive, setOptimisticActive] = useOptimistic(isActive);

  if (isSelf) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className={optimisticActive ? "text-muted-foreground hover:text-destructive" : undefined}
      onClick={() =>
        startTransition(async () => {
          setOptimisticActive(!optimisticActive);
          const result = await setUserActiveAction({ userId, active: !optimisticActive });
          if (result.ok) toast.success(optimisticActive ? `${userName} askıya alındı` : `${userName} yeniden aktif`);
          else toast.error(result.error);
        })
      }
    >
      {optimisticActive ? "Askıya al" : "Aktifleştir"}
    </Button>
  );
}

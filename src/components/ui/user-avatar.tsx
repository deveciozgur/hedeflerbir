import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { initials } from "@/lib/utils";

interface UserAvatarProps {
  user: { name: string; surname: string; avatarUrl: string | null };
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
      <AvatarFallback>{initials(user.name, user.surname)}</AvatarFallback>
    </Avatar>
  );
}

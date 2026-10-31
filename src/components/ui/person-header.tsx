import { ExternalLink, Mail } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { UserAvatar } from "./user-avatar";
import { cn, fullName, splitTags } from "@/lib/utils";

export interface PersonHeaderProps {
  person: {
    name: string;
    surname: string;
    email: string;
    avatarUrl: string | null;
    title: string | null;
    expertiseArea: string | null;
    bio: string | null;
    socialLinks: Array<{ network: string; label: string; url: string }>;
  };
  /** Render the name as the dialog's accessible title. */
  titleAs?: (name: string) => React.ReactNode;
  className?: string;
}

/** Shared profile block for mentor and instructor modals and detail pages. */
export function PersonHeader({ person, titleAs, className }: PersonHeaderProps) {
  const name = fullName(person);
  const tags = splitTags(person.expertiseArea);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-4">
        <UserAvatar user={person} className="size-14" />
        <div className="min-w-0">
          {titleAs ? titleAs(name) : <h1 className="truncate text-lg font-semibold tracking-tight">{name}</h1>}
          {person.title ? <p className="truncate text-sm text-muted-foreground">{person.title}</p> : null}
        </div>
      </div>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {person.bio ? <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{person.bio}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:${person.email}`}>
            <Mail aria-hidden /> E-posta
          </a>
        </Button>
        {person.socialLinks.map((link) => (
          <Button key={link.network} asChild variant="outline" size="sm">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden /> {link.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

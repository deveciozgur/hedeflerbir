import { ExternalLink, FileDown, FileText, type LucideIcon } from "lucide-react";
import type { ResourceType, SessionResource } from "../domain/resources";

const ICONS: Record<ResourceType, LucideIcon> = { pdf: FileText, file: FileDown, link: ExternalLink };

export function ResourceList({ resources }: { resources: SessionResource[] }) {
  if (resources.length === 0) return <p className="text-sm text-muted-foreground">Bu oturum için kaynak eklenmedi.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {resources.map((resource) => {
        const Icon = ICONS[resource.type];
        return (
          <li key={resource.url}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{resource.title}</span>
              <span className="text-xs uppercase text-muted-foreground">{resource.type}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

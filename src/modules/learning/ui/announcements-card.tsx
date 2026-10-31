import { Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/format";
import type { AnnouncementSummary } from "../application/student-dashboard.queries";

export function AnnouncementsCard({ items }: { items: AnnouncementSummary[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Duyurular</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={Megaphone} title="Yeni duyuru yok" description="Program duyuruları burada yayınlanacak." className="py-8" />
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  {item.pinned ? (
                    <Badge variant="outline">
                      <Pin aria-hidden /> Sabit
                    </Badge>
                  ) : null}
                  <time dateTime={item.publishedAt.toISOString()} className="font-mono text-xs text-subtle">
                    {formatRelative(item.publishedAt)}
                  </time>
                </div>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <EmptyState
        icon={Compass}
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir."
        action={
          <Button asChild variant="outline">
            <Link href="/">Ana sayfaya dön</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}

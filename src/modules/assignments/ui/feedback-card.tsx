import { MessageSquareQuote, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/format";
import { scorePercentage } from "../domain/submission-status";

interface FeedbackCardProps {
  instructorName: string;
  status: "GRADED" | "RETURNED";
  grade: number | null;
  maxScore: number;
  feedback: string | null;
  gradedAt: Date | null;
}

export function FeedbackCard({ instructorName, status, grade, maxScore, feedback, gradedAt }: FeedbackCardProps) {
  const returned = status === "RETURNED";

  return (
    <Card className={returned ? "border-warning/40" : undefined}>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            {returned ? (
              <RotateCcw className="size-4 text-warning" aria-hidden />
            ) : (
              <MessageSquareQuote className="size-4 text-brand" aria-hidden />
            )}
            {returned ? "Revizyon istendi" : "Eğitmen değerlendirmesi"}
          </CardTitle>
          <CardDescription>
            {instructorName}
            {gradedAt ? ` · ${formatDateTime(gradedAt)}` : null}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!returned && grade !== null ? (
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-semibold tabular-nums tracking-tight">
              {grade}
              <span className="text-base font-normal text-muted-foreground"> / {maxScore}</span>
            </p>
            <Progress value={scorePercentage(grade, maxScore)} aria-label="Puan yüzdesi" />
          </div>
        ) : null}
        {feedback ? (
          <blockquote className="border-l-2 pl-4 text-sm leading-relaxed whitespace-pre-wrap text-pretty">{feedback}</blockquote>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface ReviewRound {
  id: string;
  decision: "GRADED" | "RETURNED";
  score: number | null;
  comment: string;
  reviewerName: string | null;
  createdAt: Date;
}

/** Earlier review rounds (the latest one is shown by FeedbackCard). */
export function ReviewHistory({ reviews, maxScore }: { reviews: ReviewRound[]; maxScore: number }) {
  if (reviews.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Önceki değerlendirmeler</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4 border-l border-border pl-4">
          {reviews.map((review) => (
            <li key={review.id} className="relative flex flex-col gap-1.5">
              <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border-strong" aria-hidden />
              <p className="text-xs text-muted-foreground">
                {review.decision === "RETURNED" ? "Revizyon istendi" : `Puan ${review.score ?? "-"}/${maxScore}`}
                {review.reviewerName ? ` · ${review.reviewerName}` : null} · {formatDateTime(review.createdAt)}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{review.comment}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

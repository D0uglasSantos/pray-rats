import { BookOpen, Quote } from "lucide-react";
import { getDailyQuote } from "@/lib/constants/daily-quotes";
import { Card } from "@/components/ui/card";

export function DailyQuoteCard() {
  const quote = getDailyQuote();

  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-l-2xl" />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-2">
          {quote.type === "bible" ? (
            <BookOpen className="h-4 w-4 text-primary" />
          ) : (
            <Quote className="h-4 w-4 text-primary" />
          )}
          <p className="text-xs font-medium text-muted uppercase tracking-wide">
            {quote.type === "bible" ? "Palavra de Deus" : "Santo do dia"}
          </p>
        </div>
        <p className="text-sm text-foreground italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs text-primary font-medium mt-2">{quote.source}</p>
      </div>
    </Card>
  );
}

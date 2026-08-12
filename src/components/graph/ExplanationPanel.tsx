import { Lightbulb, Sparkles, TrendingUp } from "lucide-react";

export interface ExplanationPanelProps {
  formula: string;
  blurb?: string | undefined;
  shape: string[];
  meaning: string[];
  change: string | null;
}

export function ExplanationPanel({ formula, blurb, shape, meaning, change }: ExplanationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3">
        <p className="font-mono text-base text-foreground">{formula}</p>
        {blurb && <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>}
      </div>

      {change && (
        <div className="flex gap-3 rounded-xl border border-accent-strong/30 bg-accent/50 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
          <p className="text-sm text-foreground">{change}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> What the graph shows
          </h3>
          <ul className="space-y-1.5">
            {shape.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                {s}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-accent-strong" /> What it means
          </h3>
          <ul className="space-y-1.5">
            {meaning.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

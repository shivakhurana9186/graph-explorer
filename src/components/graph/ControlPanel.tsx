import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { VarDef } from "@/lib/modules";
import { fmt } from "@/lib/analysis";
import { RotateCcw, Shuffle, Play, Pause } from "lucide-react";

export interface ControlPanelProps {
  variables: VarDef[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
  onRandomize: () => void;
  xRange: [number, number];
  onXRange: (r: [number, number]) => void;
  compare: boolean;
  onCompare: (v: boolean) => void;
  animate: boolean;
  onAnimate: (v: boolean) => void;
  unitToggle?: { label: string; options: { name: string; factor: number }[]; active: string; onPick: (n: string) => void } | null;
}

export function ControlPanel(props: ControlPanelProps) {
  const {
    variables,
    values,
    onChange,
    onReset,
    onRandomize,
    xRange,
    onXRange,
    compare,
    onCompare,
    animate,
    onAnimate,
    unitToggle,
  } = props;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
        <Button variant="soft" size="sm" onClick={onRandomize}>
          <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Randomize
        </Button>
        <Button variant="soft" size="sm" onClick={() => onAnimate(!animate)}>
          {animate ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
          {animate ? "Stop" : "Animate"}
        </Button>
      </div>

      <div className="space-y-5">
        {variables.map((v) => (
          <div key={v.key} className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Label className="min-w-0 truncate text-sm font-medium" htmlFor={`var-${v.key}`}>
                {v.label}
                {v.unit ? <span className="ml-1 text-muted-foreground">({v.unit})</span> : null}
              </Label>
              <Input
                id={`var-${v.key}`}
                type="number"
                step={v.step}
                value={values[v.key] ?? v.default}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) onChange(v.key, n);
                }}
                className="h-8 w-24 shrink-0 text-right text-sm tabular-nums"
              />
            </div>
            <Slider
              value={[values[v.key] ?? v.default]}
              min={v.min}
              max={v.max}
              step={v.step}
              onValueChange={([n]) => onChange(v.key, n ?? v.default)}
            />
            {v.note && <p className="text-xs text-muted-foreground">{v.note}</p>}
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Graph range (x)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={xRange[0]}
            onChange={(e) => onXRange([Number(e.target.value), xRange[1]])}
            className="h-8 text-sm tabular-nums"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={xRange[1]}
            onChange={(e) => onXRange([xRange[0], Number(e.target.value)])}
            className="h-8 text-sm tabular-nums"
          />
        </div>
        <p className="text-xs text-muted-foreground">Currently plotting {fmt(xRange[1] - xRange[0])} units wide.</p>
      </div>

      {unitToggle && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{unitToggle.label}</p>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {unitToggle.options.map((o) => (
              <button
                key={o.name}
                onClick={() => unitToggle.onPick(o.name)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  unitToggle.active === o.name
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Compare mode</p>
          <p className="text-xs text-muted-foreground">Freeze the current curve and overlay your changes.</p>
        </div>
        <Switch checked={compare} onCheckedChange={onCompare} />
      </div>
    </div>
  );
}

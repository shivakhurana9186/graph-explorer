import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, Link2, Search, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraphView } from "@/components/graph/GraphView";
import { ControlPanel } from "@/components/graph/ControlPanel";
import { ExplanationPanel } from "@/components/graph/ExplanationPanel";
import { MODULES, QUANTITY_ALIASES, TOPICS, getModule, type GraphModule } from "@/lib/modules";
import { compile } from "@/lib/expression";
import { analyze, buildExplanation, samplePoints, toPolar, type Pt } from "@/lib/analysis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Graph Lab — Explore How Quantities Relate" },
      {
        name: "description",
        content:
          "Pick two quantities, plot the relationship, drag the variables and read a plain-language explanation of what the graph means.",
      },
      { property: "og:title", content: "Graph Lab — Explore How Quantities Relate" },
      {
        property: "og:description",
        content:
          "An interactive graphing tool for students: velocity vs time, force vs acceleration, pressure vs volume and 30+ more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function defaultsFor(mod: GraphModule): Record<string, number> {
  const o: Record<string, number> = {};
  for (const v of mod.variables) o[v.key] = v.default;
  return o;
}

function evalRange(src: string | undefined, scope: Record<string, number>, fallback: number): number {
  if (!src) return fallback;
  const c = compile(src);
  if (!c.ok) return fallback;
  const n = c.eval(scope);
  return Number.isFinite(n) ? n : fallback;
}

function searchModules(q: string): GraphModule[] {
  const query = q.trim().toLowerCase();
  if (!query) return MODULES;
  const words = query.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = MODULES.map((m) => {
    const hay = `${m.name} ${m.topic} ${m.formula} ${m.xLabel} ${m.yLabel} ${(m.keywords ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (hay.includes(w)) score += 2;
      const aliases = QUANTITY_ALIASES[w];
      if (aliases?.includes(m.id)) score += 3;
    }
    return { m, score };
  });
  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  return hits.length ? hits.map((s) => s.m) : [];
}

function Index() {
  const [modId, setModId] = useState("v-t");
  const [derived, setDerived] = useState<GraphModule | null>(null);
  const mod = derived ?? getModule(modId);
  const [values, setValues] = useState<Record<string, number>>(() => defaultsFor(getModule("v-t")));
  const [xRange, setXRange] = useState<[number, number]>([0, 10]);
  const [query, setQuery] = useState("");
  const [compare, setCompare] = useState(false);
  const [snapshot, setSnapshot] = useState<Pt[] | null>(null);
  const [animate, setAnimate] = useState(false);
  const [animT, setAnimT] = useState(0);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [lastChange, setLastChange] = useState<{ key: string; from: number; to: number } | null>(null);
  const [customExpr, setCustomExpr] = useState("");
  const [customOn, setCustomOn] = useState(false);
  const [dark, setDark] = useState(false);
  const [unit, setUnit] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  // ---- URL sharing: read once on mount, write on change ----
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("m");
    if (id) {
      const m = getModule(id);
      setModId(m.id);
      const next = defaultsFor(m);
      for (const v of m.variables) {
        const raw = p.get(v.key);
        if (raw !== null && !Number.isNaN(Number(raw))) next[v.key] = Number(raw);
      }
      setValues(next);
      const x0 = Number(p.get("x0"));
      const x1 = Number(p.get("x1"));
      if (Number.isFinite(x0) && Number.isFinite(x1) && x1 > x0) setXRange([x0, x1]);
    }
    const c = p.get("eq");
    if (c) {
      setCustomExpr(c);
      setCustomOn(true);
    }
    if (p.get("dark") === "1" || window.matchMedia("(prefers-color-scheme: dark)").matches) setDark(true);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ---- switching modules ----
  const pickModule = useCallback((id: string) => {
    const m = getModule(id);
    setModId(m.id);
    setCustomOn(false);
    const d = defaultsFor(m);
    setValues(d);
    setSnapshot(null);
    setLastChange(null);
    setUnit(m.units?.[0]?.options[0]?.name ?? null);
    setXRange([evalRange(m.xMin, d, 0), evalRange(m.xMax, d, 10)]);
  }, []);

  const onChange = useCallback((key: string, value: number) => {
    setValues((prev) => {
      setLastChange({ key, from: prev[key] ?? value, to: value });
      return { ...prev, [key]: value };
    });
  }, []);

  // ---- compile + sample ----
  const compiled = useMemo(() => {
    const src = customOn && customExpr.trim() ? customExpr : mod.expr;
    return compile(src);
  }, [customOn, customExpr, mod.expr]);

  const xCompiled = useMemo(() => {
    if (customOn || !mod.xExpr) return null;
    const c = compile(mod.xExpr);
    return c.ok ? c : null;
  }, [customOn, mod.xExpr]);

  const unitFactor = useMemo(() => {
    const t = mod.units?.[0];
    if (!t || !unit) return 1;
    return t.options.find((o) => o.name === unit)?.factor ?? 1;
  }, [mod.units, unit]);

  const points = useMemo(() => {
    if (!compiled.ok) return [];
    const extra: Record<string, number> = {};
    if (customOn) {
      for (const v of compiled.vars) if (v !== "x" && v !== "t") extra[v] = values[v] ?? 1;
    }
    let pts = samplePoints(compiled, xCompiled, { ...values, ...extra }, xRange[0], xRange[1]);
    if (!customOn && mod.plot === "polar") pts = toPolar(pts);
    const axis = mod.units?.[0]?.axis;
    if (unitFactor !== 1 && axis) {
      pts = pts.map((p) => (axis === "y" ? { x: p.x, y: p.y * unitFactor } : { x: p.x * unitFactor, y: p.y }));
    }
    return pts;
  }, [compiled, xCompiled, values, xRange, mod.plot, mod.units, unitFactor, customOn]);

  const customVars = useMemo(() => {
    if (!customOn || !compiled.ok) return [];
    return compiled.vars
      .filter((v) => v !== "x" && v !== "t" && v !== "theta")
      .map((v) => ({ key: v, label: v, min: -10, max: 10, step: 0.1, default: values[v] ?? 1 }));
  }, [customOn, compiled, values]);

  const analysis = useMemo(() => analyze(points), [points]);

  const explanation = useMemo(
    () => buildExplanation({ mod, a: analysis, values, prev: lastChange }),
    [mod, analysis, values, lastChange],
  );

  // ---- compare snapshot ----
  useEffect(() => {
    if (compare && !snapshot && points.length) setSnapshot(points);
    if (!compare && snapshot) setSnapshot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare]);

  // ---- animation: sweep a dot along the curve ----
  useEffect(() => {
    if (!animate || !points.length) return;
    let raf = 0;
    let start = 0;
    const loop = (ts: number) => {
      if (!start) start = ts;
      setAnimT(((ts - start) / 3000) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animate, points.length]);

  const animatedPoint = animate && points.length ? (points[Math.floor(animT * (points.length - 1))] ?? null) : null;

  // ---- share ----
  const share = useCallback(() => {
    const p = new URLSearchParams();
    p.set("m", mod.id);
    for (const v of mod.variables) p.set(v.key, String(values[v.key] ?? v.default));
    p.set("x0", String(xRange[0]));
    p.set("x1", String(xRange[1]));
    if (customOn && customExpr) p.set("eq", customExpr);
    if (dark) p.set("dark", "1");
    const url = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, "", url);
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [mod, values, xRange, customOn, customExpr, dark]);

  const results = useMemo(() => searchModules(query), [query]);
  const grouped = useMemo(
    () => TOPICS.map((t) => ({ topic: t, items: results.filter((m) => m.topic === t) })).filter((g) => g.items.length),
    [results],
  );

  const activeVars = customOn ? customVars : mod.variables;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">Graph Lab</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Pick two quantities, move the sliders, see what the graph is telling you.
            </p>
          </div>
          <Button variant="soft" size="sm" onClick={share}>
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? "Link copied" : "Share"}
          </Button>
          <Button variant="soft" size="sm" onClick={() => setDark((d) => !d)} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ---------- Left column ---------- */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: velocity, pressure, force…"
                className="pl-9"
              />
            </div>
            <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {grouped.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No stored relationship matches that. Try the custom equation box below.
                </p>
              )}
              {grouped.map((g) => (
                <div key={g.topic}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.topic}</p>
                  <div className="space-y-1">
                    {g.items.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => pickModule(m.id)}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                          m.id === modId && !customOn
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <Label htmlFor="custom-eq" className="text-sm font-semibold">
              Your own equation
            </Label>
            <Input
              id="custom-eq"
              value={customExpr}
              placeholder="y = 3x^2 - 2x + 1"
              onChange={(e) => {
                setCustomExpr(e.target.value.replace(/^\s*y\s*=/, ""));
                setCustomOn(true);
              }}
            />
            {customOn && !compiled.ok && <p className="text-xs text-destructive">{compiled.error}</p>}
            <p className="text-xs text-muted-foreground">
              Use x as the input. sin, cos, tan, sqrt, ln, log, exp, abs and pi all work.
            </p>
            {customOn && (
              <Button variant="soft" size="sm" onClick={() => setCustomOn(false)}>
                Back to {mod.name}
              </Button>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <ControlPanel
              variables={activeVars}
              values={values}
              onChange={onChange}
              onReset={() => {
                setValues(customOn ? Object.fromEntries(customVars.map((v) => [v.key, 1])) : defaultsFor(mod));
                setLastChange(null);
              }}
              onRandomize={() => {
                const next: Record<string, number> = { ...values };
                for (const v of activeVars) {
                  const r = v.min + Math.random() * (v.max - v.min);
                  next[v.key] = Number(r.toFixed(2));
                }
                setValues(next);
                setLastChange(null);
              }}
              xRange={xRange}
              onXRange={setXRange}
              compare={compare}
              onCompare={setCompare}
              animate={animate}
              onAnimate={setAnimate}
              unitToggle={
                !customOn && mod.units?.[0]
                  ? {
                      label: mod.units[0].label,
                      options: mod.units[0].options,
                      active: unit ?? mod.units[0].options[0]!.name,
                      onPick: setUnit,
                    }
                  : null
              }
            />
          </section>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">
                {customOn ? "Custom equation" : `${mod.yLabel} vs ${mod.xLabel}`}
              </h2>
              {!customOn && <span className="text-xs text-muted-foreground">{mod.topic}</span>}
            </div>
            {compiled.ok && points.length > 1 ? (
              <GraphView
                points={points}
                comparePoints={compare ? snapshot : null}
                xLabel={customOn ? "x" : mod.xLabel}
                yLabel={customOn ? "y" : mod.yLabel}
                xUnit={customOn ? undefined : mod.xUnit}
                yUnit={customOn ? undefined : mod.yUnit}
                cursor={cursor}
                onHover={setCursor}
                animatedPoint={animatedPoint}
                legend={compare && snapshot ? { main: "Now", compare: "Frozen curve" } : null}
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                {compiled.ok ? "No points to plot in this range." : "Fix the equation to see a graph."}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <ExplanationPanel
              formula={customOn ? `y = ${customExpr || "…"}` : mod.formula}
              blurb={customOn ? undefined : mod.blurb}
              shape={explanation.shape}
              meaning={explanation.meaning}
              change={explanation.change}
            />
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for curious students — every curve here is live, so keep dragging.
      </footer>
    </div>
  );
}

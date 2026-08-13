// "Relate any two quantities" engine.
// Builds a graph whose nodes are physical quantities and whose edges are the
// stored modules, then chains equations together (substitution) so that two
// quantities that are only INDIRECTLY linked still produce a single y = f(x).

import { FUNCTION_NAMES } from "./expression";
import { MODULES, type GraphModule, type VarDef } from "./modules";

/** words the user might type → the canonical axis label used by modules */
const SYNONYMS: Record<string, string> = {
  t: "time",
  time: "time",
  duration: "time",
  v: "velocity",
  velocity: "velocity",
  speed: "speed",
  u: "velocity",
  s: "distance",
  distance: "distance",
  displacement: "displacement",
  position: "distance",
  length: "distance",
  separation: "separation",
  height: "height",
  a: "acceleration",
  acceleration: "acceleration",
  f: "force",
  force: "force",
  weight: "force",
  extension: "extension",
  stretch: "extension",
  ke: "kinetic energy",
  energy: "kinetic energy",
  "kinetic energy": "kinetic energy",
  work: "kinetic energy",
  p: "pressure",
  pressure: "pressure",
  volume: "volume",
  temperature: "temperature",
  temp: "temperature",
  heat: "temperature",
  voltage: "voltage",
  pd: "voltage",
  emf: "voltage",
  current: "current",
  i: "current",
  power: "power",
  resistance: "resistance",
  depth: "depth",
  intensity: "intensity",
  brightness: "intensity",
  wavelength: "wavelength",
  concentration: "concentration",
  conc: "concentration",
  rate: "rate",
  ph: "ph",
  amplitude: "displacement",
  "wave speed": "wave speed",
  "relative intensity": "intensity",
  "object distance": "object distance",
  "image distance": "image distance",
  "rate constant": "rate constant",
  "h⁺ concentration": "concentration",
  "horizontal distance": "distance",
  "volume of base added": "volume",
};

export function normalizeQuantity(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return SYNONYMS[s] ?? s;
}

/** Pull two quantities out of a free-text query like "force vs time". */
export function parsePair(query: string): [string, string] | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const parts = q
    .replace(/^(graph|plot|show|draw)\s+(of\s+)?/, "")
    .split(/\s+(?:vs\.?|versus|against|and|with|,|-|—|→|->)\s+|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;
  const a = normalizeQuantity(parts[0]!);
  const b = normalizeQuantity(parts[1]!);
  if (!a || !b || a === b) return null;
  return [a, b];
}

interface Edge {
  mod: GraphModule;
  from: string; // normalized x quantity
  to: string; // normalized y quantity
}

const EDGES: Edge[] = MODULES.filter((m) => !m.plot && !m.xExpr && m.xLabel !== "x").map((m) => ({
  mod: m,
  from: normalizeQuantity(m.xLabel),
  to: normalizeQuantity(m.yLabel),
}));

export const KNOWN_QUANTITIES = [...new Set(EDGES.flatMap((e) => [e.from, e.to]))].sort();

/** Breadth-first search for a chain of equations from `from` to `to`. */
function findChain(from: string, to: string, maxSteps = 3): Edge[] | null {
  const queue: { at: string; path: Edge[] }[] = [{ at: from, path: [] }];
  const seen = new Set([from]);
  while (queue.length) {
    const { at, path } = queue.shift()!;
    if (path.length >= maxSteps) continue;
    for (const e of EDGES) {
      if (e.from !== at) continue;
      const next = [...path, e];
      if (e.to === to) return next;
      if (!seen.has(e.to)) {
        seen.add(e.to);
        queue.push({ at: e.to, path: next });
      }
    }
  }
  return null;
}

const RESERVED = new Set([...FUNCTION_NAMES, "pi", "PI", "e", "tau", "x", "t", "theta"]);

/** Rewrite identifiers in an expression using a rename map. */
function rename(expr: string, map: Record<string, string>): string {
  return expr.replace(/[A-Za-z_][A-Za-z_0-9]*/g, (id) => map[id] ?? id);
}

/** Replace the free variable x with a sub-expression. */
function substituteX(expr: string, inner: string): string {
  return expr.replace(/[A-Za-z_][A-Za-z_0-9]*/g, (id) => (id === "x" ? `(${inner})` : id));
}

function pretty(label: string): string {
  if (label === "ph") return "pH";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Build a single plottable module from a chain of equations.
 * Returns null when the two quantities cannot be linked.
 */
export function relate(aRaw: string, bRaw: string): GraphModule | null {
  const a = normalizeQuantity(aRaw);
  const b = normalizeQuantity(bRaw);
  let chain = findChain(a, b);
  let xQ = a;
  let yQ = b;
  if (!chain) {
    chain = findChain(b, a);
    xQ = b;
    yQ = a;
  }
  if (!chain || !chain.length) return null;

  const multi = chain.length > 1;
  const variables: VarDef[] = [];
  const exprs: string[] = [];

  chain.forEach((edge, i) => {
    const map: Record<string, string> = {};
    for (const v of edge.mod.variables) {
      if (RESERVED.has(v.key)) continue;
      const key = multi ? `${v.key}_${i + 1}` : v.key;
      map[v.key] = key;
      if (!variables.some((existing) => existing.key === key)) {
        variables.push({ ...v, key, label: multi ? `${v.label} (${edge.mod.name})` : v.label });
      }
    }
    exprs.push(rename(edge.mod.expr, map));
  });

  // compose: y = f_n( … f_2( f_1(x) ) )
  let composed = exprs[0]!;
  for (let i = 1; i < exprs.length; i++) composed = substituteX(exprs[i]!, composed);

  const first = chain[0]!.mod;
  const last = chain[chain.length - 1]!.mod;

  return {
    id: `derived:${chain.map((c) => c.mod.id).join(">")}`,
    name: `${pretty(yQ)} vs ${pretty(xQ)}`,
    topic: multi ? "Derived link" : first.topic,
    expr: composed,
    xLabel: first.xLabel,
    ...(first.xUnit ? { xUnit: first.xUnit } : {}),
    yLabel: last.yLabel,
    ...(last.yUnit ? { yUnit: last.yUnit } : {}),
    formula: chain.map((c) => c.mod.formula).join("   →   "),
    blurb: multi
      ? `These two are linked indirectly, through ${chain
          .slice(0, -1)
          .map((c) => c.mod.yLabel.toLowerCase())
          .join(" and ")}. The equations below were chained together, so moving any variable flows all the way through.`
      : first.blurb,
    variables,
    ...(first.xMin ? { xMin: first.xMin } : {}),
    ...(first.xMax ? { xMax: first.xMax } : {}),
    ...(!multi && first.meaning ? { meaning: first.meaning } : {}),
  };
}

/** Human-readable description of the chain, for the UI. */
export function chainSteps(mod: GraphModule): string[] {
  return mod.formula.split("   →   ");
}

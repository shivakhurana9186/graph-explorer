import { compile, type Compiled, type Scope } from "./expression";
import type { GraphModule } from "./modules";

export interface Pt {
  x: number;
  y: number;
}

export function samplePoints(
  yFn: Compiled,
  xFn: Compiled | null,
  scope: Scope,
  xMin: number,
  xMax: number,
  n = 400,
): Pt[] {
  const pts: Pt[] = [];
  const step = (xMax - xMin) / n;
  for (let i = 0; i <= n; i++) {
    const t = xMin + i * step;
    const s = { ...scope, x: t, t, theta: t };
    const y = yFn.eval(s);
    const x = xFn ? xFn.eval(s) : t;
    if (Number.isFinite(x) && Number.isFinite(y) && Math.abs(y) < 1e12) pts.push({ x, y });
  }
  return pts;
}

export function toPolar(pts: Pt[]): Pt[] {
  // here pts.x is theta, pts.y is r
  return pts.map((p) => ({ x: p.y * Math.cos(p.x), y: p.y * Math.sin(p.x) }));
}

export interface Analysis {
  slopeStart: number;
  slopeEnd: number;
  avgSlope: number;
  linear: boolean;
  curvature: "up" | "down" | "straight" | "mixed";
  area: number;
  yIntercept: number | null;
  roots: number[];
  yMin: number;
  yMax: number;
  monotonic: "rising" | "falling" | "mixed" | "flat";
  periodic: boolean;
}

function slopeAt(pts: Pt[], i: number): number {
  const a = pts[Math.max(0, i - 1)]!;
  const b = pts[Math.min(pts.length - 1, i + 1)]!;
  const dx = b.x - a.x;
  return dx === 0 ? 0 : (b.y - a.y) / dx;
}

export function analyze(pts: Pt[]): Analysis {
  if (pts.length < 3) {
    return {
      slopeStart: 0,
      slopeEnd: 0,
      avgSlope: 0,
      linear: false,
      curvature: "straight",
      area: 0,
      yIntercept: null,
      roots: [],
      yMin: 0,
      yMax: 0,
      monotonic: "flat",
      periodic: false,
    };
  }
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const slopeStart = slopeAt(pts, 1);
  const slopeEnd = slopeAt(pts, pts.length - 2);
  const avgSlope = (last.y - first.y) / (last.x - first.x || 1);

  // area (trapezoid)
  let area = 0;
  for (let i = 1; i < pts.length; i++) {
    area += ((pts[i]!.y + pts[i - 1]!.y) / 2) * (pts[i]!.x - pts[i - 1]!.x);
  }

  // curvature via second differences
  let up = 0;
  let down = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d2 = pts[i + 1]!.y - 2 * pts[i]!.y + pts[i - 1]!.y;
    if (d2 > 1e-9) up++;
    else if (d2 < -1e-9) down++;
  }
  const total = up + down || 1;
  const curvature: Analysis["curvature"] =
    up / total > 0.9 ? "up" : down / total > 0.9 ? "down" : up + down < pts.length * 0.05 ? "straight" : "mixed";

  // roots
  const roots: number[] = [];
  for (let i = 1; i < pts.length && roots.length < 6; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if ((a.y <= 0 && b.y >= 0) || (a.y >= 0 && b.y <= 0)) {
      const t = a.y === b.y ? 0 : a.y / (a.y - b.y);
      roots.push(a.x + t * (b.x - a.x));
    }
  }

  const ys = pts.map((p) => p.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  let rising = 0;
  let falling = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i]!.y - pts[i - 1]!.y;
    if (d > 1e-9) rising++;
    else if (d < -1e-9) falling++;
  }
  const monotonic: Analysis["monotonic"] =
    rising + falling === 0 ? "flat" : falling === 0 ? "rising" : rising === 0 ? "falling" : "mixed";

  // y-intercept (value at x = 0 if in range)
  let yIntercept: number | null = null;
  if (first.x <= 0 && last.x >= 0) {
    for (let i = 1; i < pts.length; i++) {
      if (pts[i - 1]!.x <= 0 && pts[i]!.x >= 0) {
        yIntercept = pts[i - 1]!.y;
        break;
      }
    }
  } else if (Math.abs(first.x) < 1e-9) yIntercept = first.y;

  // crude periodicity: many sign changes of the derivative
  let turns = 0;
  let prev = Math.sign(pts[1]!.y - pts[0]!.y);
  for (let i = 2; i < pts.length; i++) {
    const s = Math.sign(pts[i]!.y - pts[i - 1]!.y);
    if (s !== 0 && s !== prev) {
      turns++;
      prev = s;
    }
  }

  return {
    slopeStart,
    slopeEnd,
    avgSlope,
    linear: curvature === "straight",
    curvature,
    area,
    yIntercept,
    roots,
    yMin,
    yMax,
    monotonic,
    periodic: turns >= 3,
  };
}

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 0.001 || abs >= 1e6)) return n.toExponential(2);
  return Number(n.toFixed(digits)).toString();
}

export interface ExplainInput {
  mod: GraphModule;
  a: Analysis;
  values: Scope;
  prev?: { key: string; from: number; to: number } | null;
}

export function buildExplanation({ mod, a, values, prev }: ExplainInput): {
  shape: string[];
  meaning: string[];
  change: string | null;
} {
  const xu = mod.xUnit ? ` ${mod.xUnit}` : "";
  const yu = mod.yUnit ? ` ${mod.yUnit}` : "";
  const shape: string[] = [];

  if (mod.plot === "polar") {
    shape.push("This is a polar plot: the distance from the centre changes as the angle sweeps around.");
  } else if (mod.plot === "parametric") {
    shape.push("This is a parametric curve: both x and y are driven by the same parameter t.");
  } else {
    if (a.linear) {
      shape.push(
        `The graph is a straight line with a constant slope of ${fmt(a.avgSlope)}${yu ? ` ${mod.yUnit}` : ""}${
          xu ? ` per ${mod.xUnit}` : " per unit x"
        }.`,
      );
    } else if (a.curvature === "up") {
      shape.push(`The curve bends upward (concave up) — it gets steeper as ${mod.xLabel.toLowerCase()} increases.`);
    } else if (a.curvature === "down") {
      shape.push(`The curve bends downward (concave down) — it flattens as ${mod.xLabel.toLowerCase()} increases.`);
    } else {
      shape.push("The curve changes direction, so its slope is not constant.");
    }
    shape.push(
      `Slope starts at ${fmt(a.slopeStart)} and ends at ${fmt(a.slopeEnd)}. ${
        a.monotonic === "rising"
          ? "The values only increase across this range."
          : a.monotonic === "falling"
            ? "The values only decrease across this range."
            : a.monotonic === "flat"
              ? "The values stay constant."
              : "The values rise and fall across this range."
      }`,
    );
    if (a.yIntercept !== null) shape.push(`It crosses the y-axis at ${fmt(a.yIntercept)}${yu}.`);
    if (a.roots.length)
      shape.push(
        `It crosses zero at ${mod.xLabel.toLowerCase()} = ${a.roots.map((r) => fmt(r)).join(", ")}${xu}${
          a.roots.length >= 6 ? " (and more)" : ""
        }.`,
      );
    if (a.periodic) shape.push("The pattern repeats — this is a periodic (oscillating) relationship.");
    shape.push(`Values range from ${fmt(a.yMin)}${yu} to ${fmt(a.yMax)}${yu}.`);
  }

  const meaning: string[] = [];
  if (mod.meaning?.slope) meaning.push(mod.meaning.slope);
  if (mod.meaning?.area) meaning.push(`${mod.meaning.area} Here that area is about ${fmt(a.area)}.`);
  if (mod.meaning?.curvature) meaning.push(mod.meaning.curvature);
  if (mod.meaning?.intercept) meaning.push(mod.meaning.intercept);
  if (mod.meaning?.period) meaning.push(mod.meaning.period);
  if (!meaning.length) {
    meaning.push(
      "No specific real-world meaning is stored for this relationship, so here it is in maths terms: the slope is the rate of change of y with respect to x, and the curvature tells you whether that rate is speeding up or slowing down.",
    );
    if (a.roots.length) meaning.push("Where the curve touches zero, y has a root.");
  }

  // Named-variable sentence, e.g. "Because acceleration is 2 m/s²..."
  const drivers = mod.variables
    .filter((v) => mod.meaning?.slope && Math.abs(values[v.key] ?? 0) > 0)
    .slice(0, 1);
  for (const d of drivers) {
    if (a.linear) {
      meaning.push(
        `Because ${d.label.toLowerCase()} is ${fmt(values[d.key] ?? 0)}${d.unit ? ` ${d.unit}` : ""}, the line changes by ${fmt(
          a.avgSlope,
        )}${yu} for every 1${xu} of ${mod.xLabel.toLowerCase()}.`,
      );
    }
  }

  let change: string | null = null;
  if (prev) {
    const v = mod.variables.find((x) => x.key === prev.key);
    const dir = prev.to > prev.from ? "increased" : "decreased";
    const effect = a.linear
      ? `the line is now ${Math.abs(a.avgSlope) > 0 ? `sloping at ${fmt(a.avgSlope)}` : "flat"}`
      : `the curve reshaped — it now peaks at ${fmt(a.yMax)}${yu}`;
    change = `You ${dir} ${v ? v.label.toLowerCase() : prev.key} from ${fmt(prev.from)} to ${fmt(prev.to)}${
      v?.unit ? ` ${v.unit}` : ""
    }, so ${effect}.`;
  }

  return { shape, meaning, change };
}

/** Try to build a module on the fly from two plain-language quantity names. */
export function compileSafe(src: string) {
  return compile(src);
}

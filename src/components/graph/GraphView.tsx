import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pt } from "@/lib/analysis";
import { fmt } from "@/lib/analysis";

export interface GraphViewProps {
  points: Pt[];
  comparePoints?: Pt[] | null;
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  cursor?: Pt | null;
  onHover?: (p: Pt | null) => void;
  animatedPoint?: Pt | null;
  legend?: { main: string; compare: string } | null;
}

export function GraphView({
  points,
  comparePoints,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  cursor,
  onHover,
  animatedPoint,
  legend,
}: GraphViewProps) {
  const data = useMemo(() => {
    if (!comparePoints) return points.map((p) => ({ x: p.x, y: p.y }));
    return points.map((p, i) => ({ x: p.x, y: p.y, y2: comparePoints[i]?.y }));
  }, [points, comparePoints]);

  return (
    <div className="relative">
      {legend && (
        <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded bg-primary" /> {legend.main}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded bg-accent" /> {legend.compare}
          </span>
        </div>
      )}
      <div className="h-[300px] w-full sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 18, bottom: 28, left: 8 }}
            onMouseMove={(state) => {
              const p = state?.activePayload?.[0]?.payload as Pt | undefined;
              onHover?.(p ? { x: p.x, y: p.y } : null);
            }}
            onMouseLeave={() => onHover?.(null)}
          >
            <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v: number) => fmt(v, 2)}
              stroke="var(--border)"
              label={{
                value: xUnit ? `${xLabel} (${xUnit})` : xLabel,
                position: "insideBottom",
                offset: -16,
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              domain={["auto", "auto"]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v: number) => fmt(v, 2)}
              stroke="var(--border)"
              width={58}
              label={{
                value: yUnit ? `${yLabel} (${yUnit})` : yLabel,
                angle: -90,
                position: "insideLeft",
                fill: "var(--muted-foreground)",
                fontSize: 12,
                style: { textAnchor: "middle" },
              }}
            />
            <ReferenceLine y={0} stroke="var(--axis)" />
            <ReferenceLine x={0} stroke="var(--axis)" />
            <Tooltip
              cursor={{ stroke: "var(--ring)", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(value: number, name) => [
                `${fmt(value, 3)}${yUnit ? ` ${yUnit}` : ""}`,
                name === "y2" ? "compare" : yLabel,
              ]}
              labelFormatter={(v: number) => `${xLabel}: ${fmt(v, 3)}${xUnit ? ` ${xUnit}` : ""}`}
            />
            {comparePoints && (
              <Line
                type="monotone"
                dataKey="y2"
                stroke="var(--accent-strong)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="y"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            {cursor && <ReferenceDot x={cursor.x} y={cursor.y} r={5} fill="var(--primary)" stroke="var(--background)" />}
            {animatedPoint && (
              <ReferenceDot
                x={animatedPoint.x}
                y={animatedPoint.y}
                r={7}
                fill="var(--accent-strong)"
                stroke="var(--background)"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

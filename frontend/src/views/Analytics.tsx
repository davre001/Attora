"use client";

import * as React from "react";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/line-charts-1";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Activity, Droplets, Timer, Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

/**
 * Analytics — protocol health at a glance. Mock data, same as every ledger in
 * the app until the subgraph/worker wiring milestone: total volume secured,
 * Attestcoin operator activity, average proof-verification time, and gas cost
 * trends, on the neutral-dark chart chrome.
 *
 * Chart colors are the validated categorical pair (blue #3987E5, orange
 * #D95926) — the mint/sand brand ramp fails the lightness-band and chroma
 * checks for chart marks, so data ink uses the dataviz-validated pair while
 * brand blue remains the accent for the non-chart chrome.
 */

// 14 days of cumulative volume secured (USD) and attested locks
const volumeData = [
  { date: "Aug 27", volume: 4_200_000, locks: 23 },
  { date: "Aug 28", volume: 4_480_000, locks: 25 },
  { date: "Aug 29", volume: 4_760_000, locks: 28 },
  { date: "Aug 30", volume: 5_010_000, locks: 31 },
  { date: "Aug 31", volume: 5_180_000, locks: 33 },
  { date: "Sep 01", volume: 5_220_000, locks: 34 },
  { date: "Sep 02", volume: 5_540_000, locks: 37 },
  { date: "Sep 03", volume: 6_120_000, locks: 41 },
  { date: "Sep 04", volume: 6_480_000, locks: 44 },
  { date: "Sep 05", volume: 6_910_000, locks: 48 },
  { date: "Sep 06", volume: 7_020_000, locks: 49 },
  { date: "Sep 07", volume: 7_180_000, locks: 51 },
  { date: "Sep 08", volume: 7_950_000, locks: 56 },
  { date: "Sep 09", volume: 8_430_000, locks: 60 },
];

// 14 days of average proof-verification time (minutes) and gas cost (USD)
const costData = [
  { date: "Aug 27", verify: 18.2, gas: 4.1 },
  { date: "Aug 28", verify: 17.6, gas: 4.3 },
  { date: "Aug 29", verify: 16.9, gas: 4.0 },
  { date: "Aug 30", verify: 16.1, gas: 3.8 },
  { date: "Aug 31", verify: 15.4, gas: 3.9 },
  { date: "Sep 01", verify: 15.8, gas: 4.2 },
  { date: "Sep 02", verify: 14.9, gas: 3.7 },
  { date: "Sep 03", verify: 14.2, gas: 3.6 },
  { date: "Sep 04", verify: 13.8, gas: 3.4 },
  { date: "Sep 05", verify: 14.1, gas: 3.5 },
  { date: "Sep 06", verify: 13.5, gas: 3.3 },
  { date: "Sep 07", verify: 13.2, gas: 3.2 },
  { date: "Sep 08", verify: 12.9, gas: 3.1 },
  { date: "Sep 09", verify: 12.4, gas: 3.0 },
];

// Validated categorical pair (adjacent-pair check, dark surface #0e0e0e)
const volumeConfig = {
  volume: {
    label: "Volume secured",
    color: "var(--chart-1)",
  },
  locks: {
    label: "Attested locks",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const costConfig = {
  verify: {
    label: "Avg proof verification (min)",
    color: "var(--chart-1)",
  },
  gas: {
    label: "Avg gas cost (USD)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/** Volume line: one series + area wash, no legend box needed. */
function VolumeChart() {
  return (
    <Card className="animate-fade-up p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-snow">
            Volume secured
          </h2>
          <p className="mt-1 font-body text-sm font-light text-mist">
            Cumulative RWA collateral proven across both chains, last 14 days.
          </p>
        </div>
      </div>
      <ChartContainer
        config={volumeConfig}
        className="mt-6 h-[280px] w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
      >
        <ComposedChart
          data={volumeData}
          margin={{ top: 5, right: 12, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeOpacity={1} horizontal vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, className: "text-muted-foreground" }}
            dy={5}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, className: "text-muted-foreground" }}
            tickFormatter={(value: number) => `$${(value / 1_000_000).toFixed(1)}M`}
            domain={["dataMin - 500000", "dataMax + 500000"]}
            tickMargin={12}
          />
          <ChartTooltip
            content={<VolumeTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }}
          />
          <Area
            type="linear"
            dataKey="volume"
            stroke="transparent"
            fill="url(#volumeGradient)"
            strokeWidth={0}
            dot={false}
          />
          <Line
            type="linear"
            dataKey="volume"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{
              fill: "var(--ink-2)",
              strokeWidth: 2,
              r: 4,
              stroke: "var(--chart-1)",
            }}
          />
        </ComposedChart>
      </ChartContainer>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-mist/70">
        Volume secured · cumulative USD
      </p>
    </Card>
  );
}

/** Custom tooltip — one line key, values lead. */
function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const vol = payload.find((p) => p.dataKey === "volume");
  const locks = payload.find((p) => p.dataKey === "locks");
  if (!vol) return null;
  return (
    <div className="min-w-[190px] rounded-lg border border-white/10 bg-ink-2/95 p-3 shadow-xl backdrop-blur-xl">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-mist">{label}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-mist">
            <span className="size-2.5 rounded-full border-2 bg-ink-2" style={{ borderColor: vol.color }} />
            Volume secured
          </span>
          <span className="font-mono font-semibold text-snow">{`$${(vol.value / 1_000_000).toFixed(2)}M`}</span>
        </div>
        {locks && (
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-mist">
              <span className="size-2.5 rounded-full border-2 bg-ink-2" style={{ borderColor: "#d95926" }} />
              Attested locks
            </span>
            <span className="font-mono font-semibold text-snow">{locks.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Two series (verification time + gas) — needs the legend. */
function CostChart() {
  return (
    <Card className="animate-fade-up p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-snow">
            Proof verification & gas costs
          </h2>
          <p className="mt-1 font-body text-sm font-light text-mist">
            Average ASC verification time and per-proof gas overhead.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendKey label="Verification (min)" color="var(--chart-1)" />
          <LegendKey label="Gas cost (USD)" color="var(--chart-2)" />
        </div>
      </div>
      <ChartContainer
        config={costConfig}
        className="mt-6 h-[280px] w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
      >
        <ComposedChart
          data={costData}
          margin={{ top: 5, right: 12, left: 5, bottom: 5 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeOpacity={1} horizontal vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, className: "text-muted-foreground" }}
            dy={5}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, className: "text-muted-foreground" }}
            tickFormatter={(value: number) => `${(value).toFixed(0)}`}
            domain={[0, 20]}
            tickMargin={12}
          />
          <ChartTooltip
            content={<CostTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }}
          />
          <Line
            type="linear"
            dataKey="verify"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{
              fill: "var(--ink-2)",
              strokeWidth: 2,
              r: 4,
              stroke: "var(--chart-1)",
            }}
          />
          <Line
            type="linear"
            dataKey="gas"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={{
              fill: "var(--ink-2)",
              strokeWidth: 2,
              r: 4,
              stroke: "var(--chart-2)",
            }}
          />
        </ComposedChart>
      </ChartContainer>
    </Card>
  );
}

function CostTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[190px] rounded-lg border border-white/10 bg-ink-2/95 p-3 shadow-xl backdrop-blur-xl">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-mist">{label}</div>
      <div className="space-y-2">
        {payload.map((entry) => {
          const cfg = costConfig[entry.dataKey as keyof typeof costConfig];
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-mist">
                <span className="size-2.5 rounded-full border-2 bg-ink-2" style={{ borderColor: entry.color }} />
                {cfg?.label}
              </span>
              <span className="font-mono font-semibold text-snow">
                {entry.dataKey === "verify" ? `${entry.value.toFixed(1)} min` : `$${entry.value.toFixed(2)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Chart-series key: colored dot + label, text stays muted (never series-colored). */
function LegendKey({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 text-mist">
      <span className="size-2.5 rounded-full border-2 bg-ink-2" style={{ borderColor: color }} />
      {label}
    </span>
  );
}

interface Kpi {
  label: string;
  value: string;
  delta: number;
  deltaNote: string;
  icon: React.ComponentType<{ className?: string }>;
  spark: number[];
}

const KPIS: Kpi[] = [
  {
    label: "Total volume secured",
    value: "$8.43M",
    delta: 6.7,
    deltaNote: "vs yesterday",
    icon: Droplets,
    spark: [5.2, 5.2, 5.5, 6.1, 6.5, 6.9, 7.0, 7.2, 7.9, 8.4],
  },
  {
    label: "Attestcoin operator activity",
    value: "60 proofs/day",
    delta: 7.1,
    deltaNote: "vs last week",
    icon: Activity,
    spark: [37, 41, 44, 48, 49, 51, 54, 56, 58, 60],
  },
  {
    label: "Avg proof-verification time",
    value: "12.4 min",
    delta: -3.9,
    deltaNote: "vs last week (lower is better)",
    icon: Timer,
    spark: [15.8, 14.9, 14.2, 13.8, 14.1, 13.5, 13.2, 12.9, 12.6, 12.4],
  },
  {
    label: "Avg gas cost per proof",
    value: "$3.00",
    delta: -3.2,
    deltaNote: "vs last week (lower is better)",
    icon: Fuel,
    spark: [4.2, 3.7, 3.6, 3.4, 3.5, 3.3, 3.2, 3.1, 3.0, 3.0],
  },
];

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(" ");
  const accent = up ? "var(--chart-1)" : "rgba(255,255,255,0.28)";
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-24" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  // Volume/activity: higher is better. Verification time/gas: lower is better.
  const lowerIsBetter = kpi.label.includes("time") || kpi.label.includes("gas");
  const good = lowerIsBetter ? kpi.delta < 0 : kpi.delta > 0;
  const up = kpi.delta > 0;
  const Icon = kpi.icon;
  return (
    <Card hover className="animate-fade-up p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mint">
            <Icon className="size-4" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
            {kpi.label}
          </span>
        </div>
        <Sparkline data={kpi.spark} up={good} />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-snow">{kpi.value}</span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-mono text-[11px]",
            up ? "text-green-400" : "text-danger",
          )}
        >
          {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(kpi.delta).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 font-body text-[11px] font-light text-mist/70">{kpi.deltaNote}</p>
    </Card>
  );
}

const th =
  "px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-mist/70";
const td = "px-5 py-3.5";

/** Table view — the WCAG-clean twin of the charts. */
function AnalyticsTable() {
  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="font-display text-lg font-bold tracking-tight text-snow">Daily figures</h2>
        <p className="mt-1 font-body text-sm font-light text-mist">
          Every value shown in the charts, in table form.
        </p>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Date</th>
            <th className={cn(th, "text-right")}>Volume secured</th>
            <th className={cn(th, "text-right")}>Attested locks</th>
            <th className={cn(th, "text-right")}>Avg verification</th>
            <th className={cn(th, "text-right")}>Avg gas cost</th>
          </tr>
        </thead>
        <tbody className="font-mono text-sm">
          {volumeData.map((d, i) => (
            <tr key={d.date} className="border-t border-white/[0.05] transition-colors duration-200 hover:bg-white/[0.03]">
              <td className={cn(td, "text-snow")}>{d.date}</td>
              <td className={cn(td, "text-right text-snow")}>${(d.volume / 1_000_000).toFixed(2)}M</td>
              <td className={cn(td, "text-right text-mist")}>{d.locks}</td>
              <td className={cn(td, "text-right text-mist")}>{costData[i].verify.toFixed(1)} min</td>
              <td className={cn(td, "text-right text-mist")}>${costData[i].gas.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function Analytics() {
  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          title="Analytics"
          description="Protocol activity — volume secured, Attestcoin operator activity, proof-verification times, and gas costs across Sepolia and CC3."
        />

        {/* KPI row — the headline numbers before any chart */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k) => (
            <KpiTile key={k.label} kpi={k} />
          ))}
        </div>

        <div className="mt-4 grid gap-4">
          <VolumeChart />
          <CostChart />
        </div>

        <div className="mt-4">
          <AnalyticsTable />
        </div>

        <p className="mt-8 border-t border-white/[0.06] pt-6 font-body text-xs font-light text-mist">
          Testnet metrics only, simulated until the proof-worker telemetry milestone —
          sealed collateral sizes never appear here (§9).
        </p>
      </div>
    </section>
  );
}

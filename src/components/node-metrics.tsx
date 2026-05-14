"use client";

import * as React from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

type Point = { t: number; v: number };
type Series = { cpu: Point[]; memory: Point[]; disk: Point[] };

const REFRESH_MS = 15_000;
const RANGE_MINUTES = 15;

export function NodeMetrics({ nodeId }: { nodeId: string }) {
	const fetchMetrics = useAction(api.nodes.metricsActions.getNodeMetrics);
	const [data, setData] = React.useState<Series | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;

		const tick = async () => {
			try {
				const res = await fetchMetrics({ nodeId, rangeMinutes: RANGE_MINUTES });
				if (!cancelled) {
					setData(res);
					setError(null);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "metrics unavailable");
				}
			}
		};

		tick();
		const id = setInterval(tick, REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [nodeId, fetchMetrics]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center bg-card p-6 text-[10px] tracking-[0.04em] text-muted-foreground">
				metrics unavailable
			</div>
		);
	}

	return (
		<div className="grid h-full grid-cols-1 gap-px bg-border sm:grid-cols-3">
			<MetricChart label="cpu" unit="%" series={data?.cpu} />
			<MetricChart label="memory" unit="%" series={data?.memory} />
			<MetricChart label="disk" unit="%" series={data?.disk} />
		</div>
	);
}

function MetricChart({
	label,
	unit,
	series,
}: {
	label: string;
	unit: string;
	series?: Point[];
}) {
	const latest =
		series && series.length ? series[series.length - 1].v : null;

	const valueColor =
		latest == null
			? "text-muted-foreground"
			: latest >= 85
				? "text-[var(--status-failed,#e06b6b)]"
				: latest >= 60
					? "text-[var(--status-warning,#d6a86b)]"
					: "text-foreground";

	return (
		<div className="flex h-full min-h-0 flex-col gap-2 bg-card p-3">
			<div className="flex items-baseline justify-between">
				<span className="bp-caption text-[10px] tracking-[0.08em] uppercase">
					{label}
				</span>
				<span className={`text-sm tabular-nums ${valueColor}`}>
					{latest == null ? "—" : latest.toFixed(1)}
					<span className="ml-0.5 text-[9px] text-muted-foreground">{unit}</span>
				</span>
			</div>
			<div className="min-h-0 flex-1">
				<Sparkline series={series} />
			</div>
		</div>
	);
}

function Sparkline({ series }: { series?: Point[] }) {
	if (!series || series.length < 2) {
		return (
			<div className="h-full w-full animate-pulse bg-muted/20" aria-hidden />
		);
	}

	// viewBox is virtual — preserveAspectRatio="none" stretches it to fill.
	const w = 200;
	const h = 80;
	const pad = 2;

	// pin scale to 0..100 for percent metrics — keeps charts comparable
	const min = 0;
	const max = 100;
	const span = max - min;

	const xAt = (i: number) =>
		pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
	const yAt = (v: number) =>
		h - pad - ((v - min) / span) * (h - pad * 2);

	const linePts = series
		.map((p, i) => `${xAt(i).toFixed(2)},${yAt(p.v).toFixed(2)}`)
		.join(" ");

	const areaPts = [
		`${pad},${h - pad}`,
		...series.map((p, i) => `${xAt(i).toFixed(2)},${yAt(p.v).toFixed(2)}`),
		`${(w - pad).toFixed(2)},${h - pad}`,
	].join(" ");

	return (
		<svg
			viewBox={`0 0 ${w} ${h}`}
			preserveAspectRatio="none"
			className="block h-full w-full text-foreground/80"
			aria-hidden
		>
			{/* gridlines at 25 / 50 / 75 */}
			{[25, 50, 75].map(g => (
				<line
					key={g}
					x1={pad}
					x2={w - pad}
					y1={yAt(g)}
					y2={yAt(g)}
					stroke="currentColor"
					strokeOpacity="0.08"
					strokeDasharray="2 3"
					vectorEffect="non-scaling-stroke"
				/>
			))}
			<polygon
				points={areaPts}
				fill="currentColor"
				fillOpacity="0.08"
			/>
			<polyline
				points={linePts}
				fill="none"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

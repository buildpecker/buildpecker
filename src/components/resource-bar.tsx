import * as React from "react";
import { cn } from "@/lib/utils";

export function ResourceBar({
	label,
	used,
	total,
	unit,
	formatter,
	className,
}: {
	label: string;
	used: number;
	total: number;
	unit?: string;
	formatter?: (n: number) => string;
	className?: string;
}) {
	const pct = Math.max(0, Math.min(100, total === 0 ? 0 : (used / total) * 100));
	const fmt = formatter ?? ((n: number) => `${n}${unit ? ` ${unit}` : ""}`);
	const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<div className="flex items-baseline justify-between">
				<span className="bp-label">{label}</span>
				<span className="text-[11px] tabular-nums tracking-[0.06em] text-muted-foreground">
					<span className="text-foreground">{fmt(used)}</span>
					<span className="px-1 text-muted-foreground">/</span>
					<span>{fmt(total)}</span>
				</span>
			</div>
			<div className="relative">
				<div className="h-2 w-full border border-border bg-muted/30">
					<div
						className="h-full bg-[var(--ferrous,oklch(0.72_0.17_48))]"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<div className="absolute inset-x-0 top-full mt-0.5 flex justify-between">
					{ticks.map((t) => (
						<span
							key={t}
							className={cn(
								"h-1 w-px",
								t % 50 === 0 ? "bg-muted-foreground/70 h-1.5" : "bg-muted-foreground/40",
							)}
						/>
					))}
				</div>
			</div>
			<div className="flex justify-between pt-2 text-[9px] tabular-nums tracking-[0.12em] text-muted-foreground">
				<span>0</span>
				<span>50</span>
				<span>100</span>
			</div>
		</div>
	);
}

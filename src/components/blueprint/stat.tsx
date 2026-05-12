import * as React from "react";
import { cn } from "@/lib/utils";

type StatProps = {
	label: string;
	value: React.ReactNode;
	unit?: string;
	tag?: string;
	hint?: string;
	className?: string;
};

export function Stat({ label, value, unit, tag, hint, className }: StatProps) {
	return (
		<div
			className={cn(
				"bp-corners relative flex flex-col gap-2 border border-border bg-card/60 p-5",
				className,
			)}
		>
			<span className="bp-corner-bl" />
			<span className="bp-corner-br" />
			<div className="flex items-center justify-between">
				<span className="bp-label">{label}</span>
				{tag && (
					<span className="border border-border px-1.5 py-0.5 text-[9px] tracking-[0.16em] uppercase text-muted-foreground">
						{tag}
					</span>
				)}
			</div>
			<div className="flex items-baseline gap-2">
				<span className="font-mono text-4xl font-medium leading-none text-foreground tabular-nums">
					{value}
				</span>
				{unit && (
					<span className="text-xs tracking-[0.14em] uppercase text-muted-foreground">
						{unit}
					</span>
				)}
			</div>
			{hint && <span className="bp-caption">{hint}</span>}
		</div>
	);
}

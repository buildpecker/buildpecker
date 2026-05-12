import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
	title,
	description,
	action,
	className,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"bp-corners relative flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/40 px-6 py-12 text-center",
				className,
			)}
		>
			<span className="bp-corner-bl" />
			<span className="bp-corner-br" />
			<span className="bp-label">no records</span>
			<h3 className="text-sm font-medium tracking-[0.04em] text-foreground">{title}</h3>
			{description && (
				<p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
			{action && <div className="pt-2">{action}</div>}
		</div>
	);
}

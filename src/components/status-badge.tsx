import * as React from "react";
import { cn } from "@/lib/utils";

type DeploymentStatus = "queued" | "processing" | "completed";

const STATUS_CONFIG: Record<DeploymentStatus, { label: string; dotClass: string; ringClass: string; textClass: string }> = {
	queued: {
		label: "queued",
		dotClass: "bg-[var(--status-queued)]",
		ringClass: "border-[var(--status-queued)]/50",
		textClass: "text-[var(--status-queued)]",
	},
	processing: {
		label: "processing",
		dotClass: "bg-[var(--status-processing)]",
		ringClass: "border-[var(--status-processing)]/60",
		textClass: "text-[var(--status-processing)]",
	},
	completed: {
		label: "completed",
		dotClass: "bg-[var(--status-completed)]",
		ringClass: "border-[var(--status-completed)]/50",
		textClass: "text-[var(--status-completed)]",
	},
};

export function StatusBadge({
	status,
	className,
	showLabel = true,
}: {
	status: DeploymentStatus;
	className?: string;
	showLabel?: boolean;
}) {
	const cfg = STATUS_CONFIG[status];
	const processing = status === "processing";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 border bg-card/60 px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase",
				cfg.ringClass,
				cfg.textClass,
				className,
			)}
		>
			<span
				className={cn(
					"relative size-1.5",
					cfg.dotClass,
					processing && "before:absolute before:inset-0 before:animate-ping before:bg-[var(--status-processing)] before:opacity-60",
				)}
			/>
			{showLabel && <span>{cfg.label}</span>}
		</span>
	);
}

"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { parseEnvString } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function EnvEditor({
	value,
	onChange,
	className,
	placeholder = "KEY=value\nANOTHER_KEY=another_value",
}: {
	value: string;
	onChange: (next: string) => void;
	className?: string;
	placeholder?: string;
}) {
	const parsed = React.useMemo(() => parseEnvString(value), [value]);
	const okCount = parsed.filter((p) => p.kind === "ok").length;
	const invalidCount = parsed.filter((p) => p.kind === "invalid").length;
	const firstInvalid = parsed.find((p) => p.kind === "invalid");

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-center justify-between">
				<span className="bp-label">env variables</span>
				<div className="flex items-center gap-3 text-[10px] tracking-[0.14em] uppercase tabular-nums">
					<span className="text-[var(--status-completed)]">
						{okCount} ok
					</span>
					<span className={cn(invalidCount > 0 ? "text-destructive" : "text-muted-foreground")}>
						{invalidCount} invalid
					</span>
				</div>
			</div>
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={8}
				className="min-h-32 resize-y border-border bg-card/60 font-mono text-xs leading-relaxed tabular-nums"
				aria-invalid={invalidCount > 0}
			/>
			{firstInvalid && firstInvalid.kind === "invalid" && (
				<p className="text-[10px] tracking-[0.06em] text-destructive">
					line {firstInvalid.line}: {firstInvalid.reason}
				</p>
			)}
		</div>
	);
}

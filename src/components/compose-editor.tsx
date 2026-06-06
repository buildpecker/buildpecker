"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ComposeEditor({
	value,
	onChange,
	className,
	placeholder = "services:\n  app:\n    image: ...",
}: {
	value: string;
	onChange: (next: string) => void;
	className?: string;
	placeholder?: string;
}) {
	const lineCount = React.useMemo(
		() => (value === "" ? 0 : value.split("\n").length),
		[value],
	);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-center justify-between">
				<span className="bp-label">compose · yaml</span>
				<span className="text-[10px] tracking-[0.14em] uppercase tabular-nums text-muted-foreground">
					{lineCount} lines
				</span>
			</div>
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={20}
				spellCheck={false}
				className="min-h-80 resize-y border-border bg-card/60 font-mono text-xs leading-relaxed tabular-nums"
			/>
		</div>
	);
}

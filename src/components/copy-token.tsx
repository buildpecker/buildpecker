"use client";

import * as React from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CopyToken({
	value,
	label,
	className,
	masked = false,
}: {
	value: string;
	label?: string;
	className?: string;
	masked?: boolean;
}) {
	const [copied, setCopied] = React.useState(false);
	const [revealed, setRevealed] = React.useState(!masked);

	const display = revealed ? value : "•".repeat(Math.min(value.length, 24));

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			// ignored
		}
	};

	return (
		<div
			className={cn(
				"bp-corners relative flex w-full min-w-0 items-stretch overflow-hidden border border-border bg-card",
				className,
			)}
		>
			<span className="bp-corner-bl" />
			<span className="bp-corner-br" />
			{label && (
				<span className="flex shrink-0 items-center border-r border-border px-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
					{label}
				</span>
			)}
			<code className="block min-w-0 flex-1 truncate px-3 py-2 text-[12px] tabular-nums tracking-[0.04em] text-foreground">
				{display}
			</code>
			{masked && (
				<button
					type="button"
					onClick={() => setRevealed((r) => !r)}
					className="shrink-0 border-l border-border px-3 text-[10px] tracking-[0.16em] uppercase text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					{revealed ? "hide" : "show"}
				</button>
			)}
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onClick={handleCopy}
				className="shrink-0 rounded-none border-l border-border"
				aria-label="Copy"
			>
				{copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
			</Button>
		</div>
	);
}

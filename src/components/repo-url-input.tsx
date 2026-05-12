"use client";

import * as React from "react";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { isValidGithubRepoUrl } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function RepoUrlInput({
	value,
	onChange,
	id = "repo-url",
	className,
}: {
	value: string;
	onChange: (next: string) => void;
	id?: string;
	className?: string;
}) {
	const empty = value.trim() === "";
	const valid = !empty && isValidGithubRepoUrl(value);
	const invalid = !empty && !valid;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<label htmlFor={id} className="bp-label">
				github repository
			</label>
			<div className="relative">
				<Input
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="https://github.com/owner/repo"
					className={cn(
						"h-10 border-border bg-card/60 pr-9 text-xs tabular-nums",
						valid && "border-[var(--status-completed)]/60",
						invalid && "border-destructive/60",
					)}
				/>
				{valid && (
					<CheckCircleIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--status-completed)]" />
				)}
				{invalid && (
					<WarningIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
				)}
			</div>
			<p className={cn("text-[10px] tracking-[0.06em] text-muted-foreground", invalid && "text-destructive")}>
				{empty
					? "https:// or git@ url — public or private repository"
					: valid
						? "format ok — framework auto-detected after first deploy"
						: "expected https://github.com/owner/repo or git@github.com:owner/repo"}
			</p>
		</div>
	);
}

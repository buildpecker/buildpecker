import * as React from "react";
import { cn } from "@/lib/utils";

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
	label?: string;
	caption?: string;
	tag?: string;
	bordered?: boolean;
};

export function Panel({ className, label, caption, tag, bordered = true, children, ...props }: PanelProps) {
	return (
		<div
			className={cn(
				"bp-corners relative bg-card text-card-foreground",
				bordered && "border border-border",
				className,
			)}
			{...props}
		>
			<span className="bp-corner-bl" />
			<span className="bp-corner-br" />
			{(label || tag || caption) && (
				<div className="flex items-center justify-between border-b border-border px-4 py-2.5">
					<div className="flex items-center gap-3">
						{tag && <span className="bp-label text-[10px] text-muted-foreground">{tag}</span>}
						{label && <span className="text-xs font-medium tracking-[0.04em] text-foreground">{label}</span>}
					</div>
					{caption && <span className="bp-caption">{caption}</span>}
				</div>
			)}
			{children}
		</div>
	);
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-4", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex items-center justify-between border-t border-border px-4 py-2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase",
				className,
			)}
			{...props}
		/>
	);
}

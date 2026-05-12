import * as React from "react";
import { cn } from "@/lib/utils";

export function Dimension({
	label,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
	return (
		<div className={cn("relative flex items-center gap-2", className)} {...props}>
			<div className="relative h-px flex-1 bp-dimension" />
			{label && <span className="bp-caption whitespace-nowrap">{label}</span>}
			<div className="relative h-px flex-1 bp-dimension" />
		</div>
	);
}

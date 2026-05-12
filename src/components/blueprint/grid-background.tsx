import * as React from "react";
import { cn } from "@/lib/utils";

export function GridBackground({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			aria-hidden
			className={cn(
				"pointer-events-none absolute inset-0 bp-grid opacity-[0.35]",
				"[mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_85%)]",
				className,
			)}
			{...props}
		/>
	);
}

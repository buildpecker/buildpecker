import * as React from "react";
import { pageRevisionStamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageStamp({
	slug,
	rev,
	className,
}: {
	slug: string;
	rev?: string;
	className?: string;
}) {
	const stamp = pageRevisionStamp(slug);
	return (
		<div className={cn("bp-stamp pointer-events-none hidden md:block fixed bottom-4 right-4 z-10 select-none", className)}>
			<div className="flex gap-4">
				<span>{stamp.slug}</span>
				<span aria-hidden>·</span>
				<span>{rev ?? stamp.rev}</span>
			</div>
			<div className="flex gap-4">
				<span>{stamp.scale}</span>
				<span aria-hidden>·</span>
				<span>{stamp.date}</span>
			</div>
		</div>
	);
}

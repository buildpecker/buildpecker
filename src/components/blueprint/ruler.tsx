import * as React from "react";
import { cn } from "@/lib/utils";

type RulerProps = React.HTMLAttributes<HTMLDivElement> & {
	label?: string;
	value?: string;
};

export function Ruler({ className, label, value, ...props }: RulerProps) {
	return (
		<div className={cn("flex items-end gap-3", className)} {...props}>
			{label && (
				<span className="bp-label whitespace-nowrap pb-1 text-[10px]">{label}</span>
			)}
			<div className="bp-ruler flex-1" />
			{value && (
				<span className="bp-caption whitespace-nowrap pb-1 text-[10px]">{value}</span>
			)}
		</div>
	);
}

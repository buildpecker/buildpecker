import React from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const NodeSelector: React.FC = () => {
	const nodes = useQuery(api.nodes.queries.getAllNodes);
	if (!nodes) return <div />;
	return (
		<Select>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Select a Node to Deploy" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{
						nodes.map((n, idx) => {
							return <SelectItem key={`select-node-${idx}`} value={n.name}>{n.name}</SelectItem>
						})
					}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

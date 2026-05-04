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

export const NodeSelector: React.FC<{ setNode: React.Dispatch<React.SetStateAction<string>> }> = ({ setNode }) => {
	const user = useQuery(api.users.queries.current);
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");
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

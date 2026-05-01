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

export const ProjectSelector: React.FC = () => {
	const user = useQuery(api.users.mutations.current);
	const projects = useQuery(api.projects.queries.getAllProjectsForUser, user ? {
		userId: user._id
	} : "skip");
	if (!projects) return <div />;
	return (
		<Select>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Select a Project to Deploy" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{
						projects.map((p, idx) => {
							return <SelectItem key={`select-project-${idx}`} value={p.name}>{p.name}</SelectItem>
						})
					}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

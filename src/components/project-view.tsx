import React from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const ProjectViewTable: React.FC = () => {

	const user = useQuery(api.users.queries.current);
	const projects = useQuery(api.projects.queries.getAllProjectsForUser, user ? { userId: user._id } : "skip");

	if (!projects) {
		return <div />
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Framework</TableHead>
					<TableHead>Default Branch</TableHead>
					<TableHead className="text-right">Repo URL</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{
					projects.map((n, idx) => {
						return <TableRow key={`node-${idx}`}>
							<TableCell className="font-medium">{n.name}</TableCell>
							<TableCell>{n.framework}</TableCell>
							<TableCell>{n.defaultBranch}</TableCell>
							<TableCell className="text-right">{n.repoUrl}</TableCell>
						</TableRow>
					})
				}
			</TableBody>
		</Table>
	);
}

export default ProjectViewTable;

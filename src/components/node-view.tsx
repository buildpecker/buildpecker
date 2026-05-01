import React from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const NodeViewTable: React.FC = () => {

	const user = useQuery(api.users.mutations.current);
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");

	if (!nodes) {
		return <div />
	}

	return (
		<Table>
			<TableCaption>User's registered nodes</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Hostname</TableHead>
					<TableHead>CPU Cores</TableHead>
					<TableHead>Memory (MB)</TableHead>
					<TableHead>Disk (MB)</TableHead>
					<TableHead className="text-right">Token</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{
					nodes.map((n, idx) => {
						return <TableRow key={`node-${idx}`}>
							<TableCell className="font-medium">{n.name}</TableCell>
							<TableCell>{n.hostname}</TableCell>
							<TableCell>{n.cpuCores}</TableCell>
							<TableCell>{n.memoryMb}</TableCell>
							<TableCell>{n.diskMb}</TableCell>
							<TableCell className="text-right">{n.tokenHash}</TableCell>
						</TableRow>
					})
				}
			</TableBody>
		</Table>
	);
}

export default NodeViewTable;

"use client";

import { Authenticated, Unauthenticated, useAction, useMutation, useQuery } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import React, { useState } from "react";
import { api, internal } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NodeViewTable from "@/components/node-view";
import { NodeSelector } from "@/components/node-selector";
import { ProjectSelector } from "@/components/project-selector";
import ProjectViewTable from "@/components/project-view";

export default function Home() {
	return (
		<>
			<Authenticated>
				<UserButton />
				<Content />
			</Authenticated>
			<Unauthenticated>
				<SignInButton />
			</Unauthenticated>
		</>
	);
}

function Content() {
	const [token, setToken] = useState("Add Node");
	const [repoUrl, setRepoUrl] = useState("");
	const [isCopied, setIsCopied] = useState(false);

	const [node, setNode] = useState("");
	const [project, setProject] = useState("");

	const tokenAction = useAction(api.nodes.nodejs.actions.createRegistrationToken);
	const createProjectMutation = useMutation(api.projects.mutations.createProject);
	const currentUser = useQuery(api.users.queries.current);

	const generateToken = async () => {
		const regToken = await tokenAction();
		setToken(regToken);
	}

	return (
		<>
			<div className="w-5xl">
				<NodeViewTable />
			</div>
			<Button className="w-fit" onClick={generateToken}>{token}</Button>
			<Button className="w-fit" onClick={() => {
				navigator.clipboard.writeText(token);
				setIsCopied(true);
			}}>{!isCopied ? "Copy Token" : "Copied!"}</Button>
			<div className="space-y-2">
				<Input
					className="peer invalid:border-red-500 valid:border-green-500"
					type="url"
					required
					value={repoUrl}
					onChange={(e) => setRepoUrl(e.target.value)}
					placeholder="Enter your Github repo URL..."
					pattern="https:\/\/github\.com\/[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+\/?"
				/>
				<p className="hidden text-xs text-red-500 peer-invalid:block">
					Invalid GitHub repo URL
				</p>
				<p className="hidden text-xs text-green-500 peer-valid:block">
					Looks good
				</p>
			</div>
			<div className="w-3xl">
				<NodeSelector setNode={setNode} />
			</div>
			<div className="w-5xl">
				<ProjectViewTable />
			</div>
			<div className="w-3xl">
				<ProjectSelector setProject={setProject} />
			</div>
			<Button onClick={() => {
				if (repoUrl) createProjectMutation({
					name: repoUrl.split("/").reverse()[0],
					ownerId: currentUser?._id!,
					framework: "Next.js",
					defaultBranch: "main",
					repoUrl: repoUrl
				});
			}} className="w-fit">Create Project</Button>
			<Button className="w-fit">Deploy!!!</Button>
		</>
	);
}

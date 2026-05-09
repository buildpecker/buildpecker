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
import { Id } from "../../convex/_generated/dataModel";

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

const GITHUB_REPO_REGEX = /^(?:git@github\.com:|https:\/\/github\.com\/)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9_-]{1,100}(?:\.git)?\/?$/;

function Content() {
	const [token, setToken] = useState("Add Node");
	const [repoUrl, setRepoUrl] = useState("");
	const [isCopied, setIsCopied] = useState(false);
	const isRepoUrlValid = GITHUB_REPO_REGEX.test(repoUrl);

	const [node, setNode] = useState<Id<"nodes">>();
	const [project, setProject] = useState<Id<"projects">>();

	const tokenAction = useAction(api.nodes.nodejs.actions.createRegistrationToken);
	const createProjectMutation = useMutation(api.projects.mutations.createProject);
	const currentUser = useQuery(api.users.queries.current);

	const generateToken = async () => {
		const regToken = await tokenAction();
		setToken(regToken);
	}

	const createDeploymentMutation = useMutation(api.deployments.mutations.createDeployment);

	const idx = Math.floor(Math.random() * 5000);

	const deployProject = async () => {
		if (!node || !project) return;
		await createDeploymentMutation({ name: `Deployment ${idx}`, nodeId: node, projectId: project, imageUri: "", branch: "main", status: "queued", sha: "" });
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
					className={repoUrl === "" ? "" : isRepoUrlValid ? "border-green-500" : "border-red-500"}
					type="text"
					value={repoUrl}
					onChange={(e) => setRepoUrl(e.target.value)}
					placeholder="Enter your Github repo URL..."
				/>
				{repoUrl !== "" && !isRepoUrlValid && (
					<p className="text-xs text-red-500">Invalid GitHub repo URL</p>
				)}
				{repoUrl !== "" && isRepoUrlValid && (
					<p className="text-xs text-green-500">Looks good</p>
				)}
			</div>
			<div className="w-3xl">
				<NodeSelector value={node} onChange={setNode} />
			</div>
			<div className="w-5xl">
				<ProjectViewTable />
			</div>
			<div className="w-3xl">
				<ProjectSelector value={project} onChange={setProject} />
			</div>
			<Button onClick={() => {
				if (isRepoUrlValid) createProjectMutation({
					name: repoUrl.split("/").reverse()[0],
					ownerId: currentUser?._id!,
					framework: "",
					defaultBranch: "main",
					repoUrl: repoUrl
				});
			}} className="w-fit">Create Project</Button>
			<p>{project}<br />{node}</p>
			<Button onClick={() => deployProject()} className="w-fit">Deploy!!!</Button>
		</>
	);
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { RepoUrlInput } from "@/components/repo-url-input";
import { EnvEditor } from "@/components/env-editor";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { deriveProjectNameFromRepoUrl, isValidGithubRepoUrl } from "@/lib/validation";

export default function NewProjectPage() {
	const router = useRouter();
	const user = useQuery(api.users.queries.current);
	const createProject = useMutation(api.projects.mutations.createProject);
	const createEnv = useMutation(api.environments.mutations.createProjectEnvironment);
	const createSecrets = useAction(api.environments.actions.createProjectSecrets);

	const [repoUrl, setRepoUrl] = React.useState("");
	const [envString, setEnvString] = React.useState("");
	const [branch, setBranch] = React.useState("main");
	const [submitting, setSubmitting] = React.useState(false);

	const repoValid = isValidGithubRepoUrl(repoUrl);
	const projectName = repoValid ? deriveProjectNameFromRepoUrl(repoUrl) : "";

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!repoValid || !user) return;
		setSubmitting(true);
		try {
			const projectId = await createProject({
				name: projectName,
				ownerId: user._id,
				framework: "Unknown",
				defaultBranch: branch,
				repoUrl: repoUrl.trim(),
			});
			if (envString.trim() !== "") {
				const envId = await createEnv({ id: projectId });
				await createSecrets({ envId, envString });
			}
			toast.success(`project ${projectName} created`);
			router.push(`/projects/${projectId}`);
		} catch (err) {
			toast.error("failed to create project", {
				description: err instanceof Error ? err.message : String(err),
			});
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">new · project</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption">step 1 / 1</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Register a project</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Paste a GitHub URL. The framework is detected at first deploy by the receiving node.
						Environment variables, if provided, are encrypted at rest with AES-256-GCM.
					</p>
				</header>

				<form onSubmit={onSubmit} className="space-y-6">
					<Panel tag="01" label="Repository">
						<PanelBody className="space-y-5">
							<RepoUrlInput value={repoUrl} onChange={setRepoUrl} />
							{repoValid && (
								<div className="border border-border bg-card/40 p-3">
									<div className="bp-label pb-2">derived</div>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="flex flex-col">
											<span className="bp-caption">project name</span>
											<span className="text-foreground">{projectName}</span>
										</div>
										<div className="flex flex-col">
											<span className="bp-caption">default branch</span>
											<input
												value={branch}
												onChange={(e) => setBranch(e.target.value)}
												className="bg-transparent text-foreground outline-none focus:outline-1 focus:outline-primary"
											/>
										</div>
									</div>
								</div>
							)}
						</PanelBody>
					</Panel>

					<Panel tag="02" label="Environment" caption="optional · encrypted">
						<PanelBody className="space-y-3">
							<p className="text-[11px] leading-relaxed text-muted-foreground">
								Paste KEY=VALUE pairs, one per line. Comments with <code className="px-1 text-foreground">#</code> are ignored. Keys must be uppercase or use underscores.
							</p>
							<EnvEditor value={envString} onChange={setEnvString} />
						</PanelBody>
					</Panel>

					<div className="flex items-center justify-between gap-4 border-t border-border pt-6">
						<Button asChild variant="ghost" size="sm">
							<Link href="/projects">cancel</Link>
						</Button>
						<Button type="submit" size="lg" disabled={!repoValid || submitting || !user}>
							{submitting ? (
								<>
									<CircleNotchIcon className="size-4 animate-spin" /> creating
								</>
							) : (
								"register project"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { CircleNotchIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { formatMb } from "@/lib/format";

export default function NewDeploymentPage() {
	return (
		<React.Suspense fallback={
			<div className="flex flex-col">
				<Topbar />
				<div className="flex items-center justify-center px-6 py-16 text-muted-foreground">
					<CircleNotchIcon className="size-4 animate-spin" />
				</div>
			</div>
		}>
			<NewDeploymentForm />
		</React.Suspense>
	);
}

function NewDeploymentForm() {
	const router = useRouter();
	const search = useSearchParams();
	const presetProject = search.get("projectId") as Id<"projects"> | null;

	const user = useQuery(api.users.queries.current);
	const projects = useQuery(api.projects.queries.getAllProjectsForUser, user ? { userId: user._id } : "skip");
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");
	const createDeployment = useAction(api.deployments.actions.createDeployment);

	const [projectId, setProjectId] = React.useState<Id<"projects"> | undefined>(presetProject ?? undefined);
	const [nodeId, setNodeId] = React.useState<Id<"nodes"> | undefined>();
	const [branch, setBranch] = React.useState("main");
	const [submitting, setSubmitting] = React.useState(false);

	const ready = projectId && nodeId && branch.trim() !== "";

	const project = projects?.find((p) => p._id === projectId);
	const node = nodes?.find((n) => n._id === nodeId);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!ready) return;
		setSubmitting(true);
		try {
			const idx = Math.floor(Math.random() * 5000);
			const id = await createDeployment({
				name: `${project?.name ?? "deploy"}-${idx}`,
				projectId: projectId!,
				nodeId: nodeId!,
				type: "project",
				branch,
				imageUri: "",
				status: "queued",
			});
			toast.success("deployment queued");
			router.push(`/deployments/${id}`);
		} catch (err) {
			toast.error("failed to queue deployment", {
				description: err instanceof Error ? err.message : String(err),
			});
			setSubmitting(false);
		}
	};

	const noProjects = projects?.length === 0;
	const noNodes = nodes?.length === 0;

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">new · deployment</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption">step 1 / 1</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Queue a deployment</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Send a project to a node. It enters the queue with status <code className="text-foreground">queued</code> and is picked up on the next node poll.
					</p>
				</header>

				{noProjects || noNodes ? (
					<EmptyState
						title="Missing prerequisites"
						description={
							noProjects && noNodes
								? "You need at least one project and one node before you can deploy."
								: noProjects
									? "Register a project first."
									: "Register a node first."
						}
						action={
							<div className="flex gap-2">
								{noProjects && (
									<Button asChild size="sm">
										<Link href="/projects/new">new project</Link>
									</Button>
								)}
								{noNodes && (
									<Button asChild size="sm" variant={noProjects ? "outline" : "default"}>
										<Link href="/nodes/new">register node</Link>
									</Button>
								)}
							</div>
						}
					/>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						<Panel tag="01" label="Source">
							<PanelBody className="space-y-4">
								<div className="flex flex-col gap-2">
									<label className="bp-label">project</label>
									<Select
										value={projectId ?? ""}
										onValueChange={(v) => setProjectId(v as Id<"projects">)}
									>
										<SelectTrigger className="w-full border-border bg-card/60">
											<SelectValue placeholder="select a project" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{(projects ?? []).map((p) => (
													<SelectItem key={p._id} value={p._id}>
														{p.name} · {p.framework || "unknown"}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-2">
									<label className="bp-label">branch</label>
									<Input
										value={branch}
										onChange={(e) => setBranch(e.target.value)}
										placeholder="main"
										className="bg-card/60"
									/>
								</div>
							</PanelBody>
						</Panel>

						<Panel tag="02" label="Target">
							<PanelBody className="space-y-4">
								<div className="flex flex-col gap-2">
									<label className="bp-label">node</label>
									<Select
										value={nodeId ?? ""}
										onValueChange={(v) => setNodeId(v as Id<"nodes">)}
									>
										<SelectTrigger className="w-full border-border bg-card/60">
											<SelectValue placeholder="select a node" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{(nodes ?? []).map((n) => (
													<SelectItem key={n._id} value={n._id}>
														{n.name} · {n.hostname} · {formatMb(n.memoryMb)}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								{node && project && (
									<div className="border border-dashed border-border bg-card/40 px-3 py-3 text-[11px]">
										<div className="bp-label pb-1">routing</div>
										<div className="font-mono text-foreground">
											{project.name}@{branch || "—"} → {node.name} ({node.hostname})
										</div>
									</div>
								)}
							</PanelBody>
						</Panel>

						<div className="flex items-center justify-between gap-4 border-t border-border pt-6">
							<Button asChild variant="ghost" size="sm">
								<Link href="/deployments">cancel</Link>
							</Button>
							<Button type="submit" size="lg" disabled={!ready || submitting}>
								{submitting ? (
									<>
										<CircleNotchIcon className="size-4 animate-spin" /> queueing
									</>
								) : (
									<>
										<RocketLaunchIcon className="size-4" /> queue deployment
									</>
								)}
							</Button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}

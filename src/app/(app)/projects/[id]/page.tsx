"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyToken } from "@/components/copy-token";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ArrowRightIcon, GithubLogoIcon, RocketLaunchIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { relativeTime, shortId } from "@/lib/format";

export default function ProjectDetailPage() {
	const params = useParams<{ id: string }>();
	const projectId = params.id as Id<"projects">;
	const project = useQuery(api.projects.queries.getProjectById, { id: projectId });
	const deployments = useQuery(api.deployments.queries.getDeploymentsByProject, { projectId });

	if (project === undefined) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16 text-muted-foreground">
					<CircleNotchIcon className="size-4 animate-spin" />
				</div>
			</div>
		);
	}

	if (project === null) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="mx-auto w-full max-w-3xl px-6 py-12">
					<EmptyState title="Project not found" description="It may have been deleted or you don't have access." />
				</div>
			</div>
		);
	}

	const sortedDeploys = (deployments ?? []).slice().sort((a, b) => b._creationTime - a._creationTime);

	return (
		<div className="flex flex-col">
			<Topbar
				action={
					<Button asChild size="sm">
						<Link href={`/deployments/new?projectId=${projectId}`} className="gap-1.5">
							<RocketLaunchIcon className="size-3.5" /> deploy
						</Link>
					</Button>
				}
			/>

			<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">project · {shortId(project._id)}</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{relativeTime(project._creationTime)}</span>
					</div>
					<div className="flex items-start justify-between gap-6">
						<div className="flex flex-col gap-2">
							<h1 className="text-3xl font-medium tracking-[-0.01em] text-foreground">{project.name}</h1>
							<a
								href={project.repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
							>
								<GithubLogoIcon className="size-3.5" />
								<span>{project.repoUrl.replace(/^https?:\/\//, "")}</span>
							</a>
						</div>
						<div className="hidden flex-col items-end gap-1 text-right text-[10px] tracking-[0.14em] uppercase text-muted-foreground md:flex">
							<span>framework · {project.framework || "unknown"}</span>
							<span>branch · {project.defaultBranch}</span>
						</div>
					</div>
				</header>

				<Tabs defaultValue="overview" className="w-full">
					<TabsList className="rounded-none border border-border bg-card/40 p-0">
						<TabsTrigger value="overview" className="rounded-none px-4 py-2 text-[11px] tracking-[0.12em] uppercase">
							overview
						</TabsTrigger>
						<TabsTrigger value="deployments" className="rounded-none px-4 py-2 text-[11px] tracking-[0.12em] uppercase">
							deployments
						</TabsTrigger>
						<TabsTrigger value="environment" className="rounded-none px-4 py-2 text-[11px] tracking-[0.12em] uppercase">
							environment
						</TabsTrigger>
						<TabsTrigger value="settings" className="rounded-none px-4 py-2 text-[11px] tracking-[0.12em] uppercase">
							settings
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="pt-6">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<Panel tag="A" label="Specification">
								<PanelBody className="space-y-3 text-xs">
									<Spec label="project id" value={project._id} mono />
									<Spec label="framework" value={project.framework || "unknown"} />
									<Spec label="default branch" value={project.defaultBranch} />
									<Spec label="build command" value={project.buildCommand || "—"} mono />
									<Spec label="start command" value={project.startCommand || "—"} mono />
								</PanelBody>
							</Panel>
							<Panel tag="B" label="Activity" caption={`${sortedDeploys.length} deploys`}>
								{sortedDeploys.length === 0 ? (
									<PanelBody>
										<EmptyState
											title="No deployments yet"
											description="Trigger your first deploy from the toolbar."
										/>
									</PanelBody>
								) : (
									<ul className="divide-y divide-border">
										{sortedDeploys.slice(0, 5).map((d) => (
											<li key={d._id}>
												<Link
													href={`/deployments/${d._id}`}
													className="bp-row flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
												>
													<div className="flex items-center gap-3">
														<StatusBadge status={d.status} />
														<span className="text-xs">{d.name}</span>
													</div>
													<span className="bp-caption text-[10px] tabular-nums">
														{relativeTime(d._creationTime)}
													</span>
												</Link>
											</li>
										))}
									</ul>
								)}
							</Panel>
						</div>
					</TabsContent>

					<TabsContent value="deployments" className="pt-6">
						<Panel tag="D" label="All deployments" caption={`${sortedDeploys.length} rows`}>
							{sortedDeploys.length === 0 ? (
								<PanelBody>
									<EmptyState title="No deployments yet" />
								</PanelBody>
							) : (
								<table className="w-full text-xs">
									<thead className="text-left">
										<tr className="border-b border-border text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
											<th className="px-4 py-2.5">status</th>
											<th className="px-4 py-2.5">name</th>
											<th className="px-4 py-2.5">branch</th>
											<th className="px-4 py-2.5">sha</th>
											<th className="px-4 py-2.5">created</th>
											<th className="w-10 px-4 py-2.5" />
										</tr>
									</thead>
									<tbody>
										{sortedDeploys.map((d) => (
											<tr key={d._id} className="border-b border-border/60 hover:bg-muted/30">
												<td className="px-4 py-3"><StatusBadge status={d.status} /></td>
												<td className="px-4 py-3 font-medium text-foreground">{d.name}</td>
												<td className="px-4 py-3 text-muted-foreground">{d.branch}</td>
												<td className="px-4 py-3 text-muted-foreground tabular-nums">
													{d.sha ? shortId(d.sha, 7, 0) : "—"}
												</td>
												<td className="px-4 py-3 text-muted-foreground tabular-nums">
													{relativeTime(d._creationTime)}
												</td>
												<td className="px-4 py-3">
													<Link
														href={`/deployments/${d._id}`}
														className="inline-flex size-7 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary"
													>
														<ArrowRightIcon className="size-3.5" />
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</Panel>
					</TabsContent>

					<TabsContent value="environment" className="pt-6">
						<Panel tag="E" label="Environment vault" caption="encrypted at rest">
							<PanelBody className="space-y-4 text-xs">
								<p className="leading-relaxed text-muted-foreground">
									Secrets are stored encrypted with AES-256-GCM (dual-layer: data key wrapped by master key).
									Plaintext values are only released to the receiving node at deploy time.
								</p>
								<p className="leading-relaxed text-muted-foreground">
									Per-project secret editing is read-only in this view — paste secrets at project creation,
									or re-create the project to rotate them.
								</p>
								<div className="flex items-center gap-3 border border-dashed border-border bg-card/40 p-4">
									<span className="bp-label">status</span>
									<span className="text-foreground">vault initialised</span>
								</div>
							</PanelBody>
						</Panel>
					</TabsContent>

					<TabsContent value="settings" className="pt-6">
						<Panel tag="S" label="Settings">
							<PanelBody className="space-y-3 text-xs text-muted-foreground">
								<p>Identifiers and metadata. Most fields are immutable post-creation.</p>
								<CopyToken label="project id" value={project._id} />
								<CopyToken label="repo url" value={project.repoUrl} />
							</PanelBody>
						</Panel>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

function Spec({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
			<span className="bp-label whitespace-nowrap">{label}</span>
			<span className={`${mono ? "tabular-nums" : ""} text-foreground`}>{value}</span>
		</div>
	);
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { StatusBadge } from "@/components/status-badge";
import { CopyToken } from "@/components/copy-token";
import { EmptyState } from "@/components/empty-state";
import { CircleNotchIcon, GithubLogoIcon, HardDrivesIcon, FolderIcon, FileTextIcon } from "@phosphor-icons/react";
import { relativeTime, shortId } from "@/lib/format";

export default function DeploymentDetailPage() {
	const params = useParams<{ id: string }>();
	const id = params.id as Id<"deployments">;
	const dep = useQuery(api.deployments.queries.getDeploymentById, { id });

	if (dep === undefined) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="flex items-center justify-center px-6 py-16 text-muted-foreground">
					<CircleNotchIcon className="size-4 animate-spin" />
				</div>
			</div>
		);
	}

	if (dep === null) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="mx-auto w-full max-w-3xl px-6 py-12">
					<EmptyState title="Deployment not found" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">deployment · {shortId(dep._id)}</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{relativeTime(dep._creationTime)}</span>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<StatusBadge status={dep.status} />
							<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">{dep.name}</h1>
						</div>
						<div className="flex items-center gap-4 text-[11px] tracking-[0.06em] tabular-nums text-muted-foreground">
							<span>branch · <span className="text-foreground">{dep.branch}</span></span>
							{dep.sha && <span>sha · <span className="text-foreground">{shortId(dep.sha, 7, 0)}</span></span>}
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<Panel tag="A" label="Project">
						{dep.project ? (
							<PanelBody className="space-y-3 text-xs">
								<div className="flex items-center gap-2">
									<FolderIcon className="size-4 text-primary" />
									<Link
										href={`/projects/${dep.project._id}`}
										className="font-medium text-foreground hover:underline underline-offset-2"
									>
										{dep.project.name}
									</Link>
								</div>
								<a
									href={dep.project.repoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
								>
									<GithubLogoIcon className="size-3.5" />
									{dep.project.repoUrl.replace(/^https?:\/\//, "")}
								</a>
								<Spec label="framework" value={dep.project.framework || "unknown"} />
								<Spec label="default branch" value={dep.project.defaultBranch} />
							</PanelBody>
						) : (
							<PanelBody><EmptyState title="Project removed" /></PanelBody>
						)}
					</Panel>

					<Panel tag="B" label="Target node">
						{dep.node ? (
							<PanelBody className="space-y-3 text-xs">
								<div className="flex items-center gap-2">
									<HardDrivesIcon className="size-4 text-primary" />
									<Link
										href={`/nodes/${dep.node._id}`}
										className="font-medium text-foreground hover:underline underline-offset-2"
									>
										{dep.node.name}
									</Link>
								</div>
								<Spec label="hostname" value={dep.node.hostname} />
								<Spec label="cpu" value={`${dep.node.cpuCores} cores`} />
							</PanelBody>
						) : (
							<PanelBody><EmptyState title="Node removed" /></PanelBody>
						)}
					</Panel>
				</div>

				<Panel tag="C" label="Build output" caption="logs · stream">
					<PanelBody className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
						<FileTextIcon className="size-6 text-muted-foreground/60" />
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-foreground">Streaming logs unavailable</span>
							<span className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
								The current backend stores no log table — the receiving node writes output to its own filesystem.
								Add a logs table or stream endpoint to surface build output here.
							</span>
						</div>
					</PanelBody>
					<PanelFooter>
						<span>section C · output</span>
						<span className="tabular-nums">live · n/a</span>
					</PanelFooter>
				</Panel>

				<Panel tag="D" label="Identifiers">
					<PanelBody className="space-y-3">
						<CopyToken label="deployment id" value={dep._id} />
						{dep.imageUri && <CopyToken label="image uri" value={dep.imageUri} />}
					</PanelBody>
				</Panel>
			</div>
		</div>
	);
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-1.5">
			<span className="bp-label whitespace-nowrap">{label}</span>
			<span className="text-foreground">{value}</span>
		</div>
	);
}

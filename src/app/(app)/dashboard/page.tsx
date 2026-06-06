"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { Stat } from "@/components/blueprint/stat";
import { Ruler } from "@/components/blueprint/ruler";
import { StatusBadge } from "@/components/status-badge";
import { ResourceBar } from "@/components/resource-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PlusIcon, ArrowRightIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { relativeTime, shortId, formatMb } from "@/lib/format";

export default function DashboardPage() {
	const user = useQuery(api.users.queries.current);
	const projects = useQuery(api.projects.queries.getAllProjectsForUser, user ? { userId: user._id } : "skip");
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");
	const deployments = useQuery(api.deployments.queries.getAllDeploymentsForUser, user ? { userId: user._id } : "skip");

	const loading = !user || !projects || !nodes || !deployments;

	const projectCount = projects?.length ?? 0;
	const nodeCount = nodes?.length ?? 0;
	const deployCount = deployments?.length ?? 0;
	const processingCount = deployments?.filter((d) => d.status === "processing").length ?? 0;
	const queuedCount = deployments?.filter((d) => d.status === "queued").length ?? 0;

	const recent = (deployments ?? []).slice(0, 5);

	return (
		<div className="flex flex-col">
			<Topbar
				action={
					<Button asChild size="sm">
						<Link href="/deployments/new" className="gap-1.5">
							<PlusIcon className="size-3.5" /> new deployment
						</Link>
					</Button>
				}
			/>

			<div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">overview</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">
							sheet 01 / 04 · {new Date().toISOString().slice(0, 10)}
						</span>
					</div>
					<h1 className="text-3xl font-medium tracking-[-0.01em] text-foreground">
						Welcome back<span className="text-muted-foreground">.</span>
					</h1>
					<p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
						Forge deploys your projects to the servers you own — no third-party hosting,
						no cold starts you didn&apos;t buy. This is the floor plan.
					</p>
				</header>

				<section>
					<Ruler label="A · resource summary" value="scale 1:1" />
					<div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
						<Stat label="projects" value={loading ? "—" : projectCount} unit="repo" tag="01" />
						<Stat label="nodes" value={loading ? "—" : nodeCount} unit="host" tag="02" />
						<Stat label="deployments" value={loading ? "—" : deployCount} unit="total" tag="03" />
						<Stat
							label="in flight"
							value={loading ? "—" : processingCount}
							unit={`${queuedCount} queued`}
							tag="04"
							hint={processingCount > 0 ? "live build in progress" : "idle"}
						/>
					</div>
				</section>

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
					<Panel
						className="lg:col-span-3"
						tag="B"
						label="Recent deployments"
						caption={loading ? "loading" : `${recent.length} of ${deployCount}`}
					>
						{loading ? (
							<PanelBody className="flex items-center justify-center py-12 text-muted-foreground">
								<CircleNotchIcon className="size-4 animate-spin" />
							</PanelBody>
						) : recent.length === 0 ? (
							<PanelBody>
								<EmptyState
									title="No deployments yet"
									description="Create a project, register a node, and trigger your first deploy."
									action={
										<Button asChild size="sm">
											<Link href="/projects/new">create project</Link>
										</Button>
									}
								/>
							</PanelBody>
						) : (
							<ul className="divide-y divide-border">
								{recent.map((d) => (
									<li key={d._id}>
										<Link
											href={`/deployments/${d._id}`}
											className="bp-row group flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<StatusBadge status={d.status} />
												<div className="flex min-w-0 flex-col">
													<span className="truncate text-xs font-medium text-foreground">
														{d.name}
													</span>
													<span className="bp-caption truncate text-[10px]">
														{d.project?.name ?? d.infra?.containerName ?? "—"} · {d.branch || "infra"}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-4 text-[10px] tabular-nums tracking-[0.06em] text-muted-foreground">
												<span>{relativeTime(d._creationTime)}</span>
												<span className="hidden md:inline">{shortId(d._id)}</span>
												<ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
											</div>
										</Link>
									</li>
								))}
							</ul>
						)}
						<PanelFooter>
							<span>section B · {loading ? "—" : `${recent.length}/${deployCount}`} shown</span>
							<Link href="/deployments" className="hover:text-foreground">
								view all →
							</Link>
						</PanelFooter>
					</Panel>

					<Panel
						className="lg:col-span-2"
						tag="C"
						label="Node fleet"
						caption={loading ? "loading" : `${nodeCount} hosts`}
					>
						{loading ? (
							<PanelBody className="flex items-center justify-center py-12 text-muted-foreground">
								<CircleNotchIcon className="size-4 animate-spin" />
							</PanelBody>
						) : nodes && nodes.length > 0 ? (
							<ul className="divide-y divide-border">
								{nodes.slice(0, 4).map((n) => (
									<li key={n._id}>
										<Link
											href={`/nodes/${n._id}`}
											className="bp-row block px-4 py-3 hover:bg-muted/30"
										>
											<div className="flex items-baseline justify-between gap-3 pb-2">
												<span className="text-xs font-medium text-foreground">{n.name}</span>
												<span className="bp-caption text-[10px] tabular-nums">{n.hostname}</span>
											</div>
											<div className="flex gap-3 text-[10px] tabular-nums text-muted-foreground">
												<span><span className="text-foreground">{n.cpuCores}</span> cores</span>
												<span><span className="text-foreground">{formatMb(n.memoryMb)}</span> mem</span>
												<span><span className="text-foreground">{formatMb(n.diskMb)}</span> disk</span>
											</div>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<PanelBody>
								<EmptyState
									title="No nodes registered"
									description="Register a VPS to start receiving deployments."
									action={
										<Button asChild size="sm">
											<Link href="/nodes/new">register node</Link>
										</Button>
									}
								/>
							</PanelBody>
						)}
						<PanelFooter>
							<span>section C · fleet</span>
							<Link href="/nodes" className="hover:text-foreground">
								view all →
							</Link>
						</PanelFooter>
					</Panel>
				</section>

				<section className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Panel tag="D" label="Throughput sample" caption="indicative">
						<PanelBody className="space-y-5">
							<ResourceBar
								label="queue depth"
								used={queuedCount}
								total={Math.max(queuedCount + processingCount, 10)}
								unit="jobs"
							/>
							<ResourceBar
								label="active builds"
								used={processingCount}
								total={Math.max(processingCount + 1, nodeCount)}
								unit="proc"
							/>
							<ResourceBar
								label="completed"
								used={deployments?.filter(d => d.status === "completed").length ?? 0}
								total={Math.max(deployCount, 1)}
								unit="ok"
							/>
						</PanelBody>
					</Panel>

					<Panel tag="E" label="Schematic" caption="forge.v0.1">
						<PanelBody className="font-mono text-[11px] leading-relaxed text-muted-foreground">
							<pre className="overflow-x-auto whitespace-pre-wrap">{`  ┌── client ──┐
  │  forge ui  │
  └─────┬──────┘
        │
  ┌─────▼──────┐    ┌──────────────┐
  │  convex    │◀──▶│ encrypted    │
  │  backend   │    │ secrets vault│
  └─────┬──────┘    └──────────────┘
        │
   queued/processing/completed
        │
  ┌─────▼──────┐
  │   nodes    │  ← your VPS fleet
  └────────────┘`}</pre>
						</PanelBody>
						<PanelFooter>
							<span>section E · architecture</span>
							<span className="tabular-nums">rev. 0042</span>
						</PanelFooter>
					</Panel>
				</section>
			</div>
		</div>
	);
}

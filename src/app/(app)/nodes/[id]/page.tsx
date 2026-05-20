"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { ResourceBar } from "@/components/resource-bar";
import { StatusBadge } from "@/components/status-badge";
import { CopyToken } from "@/components/copy-token";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { HardDrivesIcon, ArrowRightIcon, CircleNotchIcon, PulseIcon } from "@phosphor-icons/react";
import { formatMb, relativeTime, relativeTimeIntl, shortId } from "@/lib/format";
import { useNow } from "@/hooks/use-now";

export default function NodeDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const nodeId = params.id as Id<"nodes">;
	const node = useQuery(api.nodes.queries.getNodeById, { id: nodeId });
	const deployments = useQuery(api.deployments.queries.getDeploymentsByNode, { nodeId });
	const deleteNode = useAction(api.nodes.actions.deleteNodeFromDashboard);
	const now = useNow(1000);

	if (node === undefined) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="flex items-center justify-center px-6 py-16 text-muted-foreground">
					<CircleNotchIcon className="size-4 animate-spin" />
				</div>
			</div>
		);
	}

	if (node === null) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="mx-auto w-full max-w-3xl px-6 py-12">
					<EmptyState title="Node not found" />
				</div>
			</div>
		);
	}

	const sortedDeploys = (deployments ?? []).slice().sort((a, b) => b._creationTime - a._creationTime);
	const queued = sortedDeploys.filter(d => d.status === "queued").length;
	const processing = sortedDeploys.filter(d => d.status === "processing").length;
	const completed = sortedDeploys.filter(d => d.status === "completed").length;

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">node · {shortId(node._id)}</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{relativeTime(node._creationTime)}</span>
					</div>
					<div className="flex items-start justify-between gap-6">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center border border-border bg-card">
								<HardDrivesIcon className="size-5 text-primary" />
							</div>
							<div className="flex flex-col gap-1">
								<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">{node.name}</h1>
								<span className="bp-caption text-[11px]">{node.hostname}</span>
							</div>
						</div>
						<div className="flex flex-col items-end gap-1">
							<span className="bp-label">heartbeat</span>
							<div className="inline-flex items-center gap-1.5">
								<PulseIcon
									className={`size-3.5 ${now - node.lastHeartbeat < 60_000 ? "text-[var(--status-completed)]" : "text-muted-foreground"}`}
									weight={now - node.lastHeartbeat < 60_000 ? "fill" : "regular"}
								/>
								<span className="text-xs tabular-nums text-foreground">
									last timestamp {relativeTimeIntl(node.lastHeartbeat, now)}
								</span>
							</div>
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<Panel className="lg:col-span-2" tag="A" label="Specifications">
						<PanelBody className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<Stat label="cpu" value={String(node.cpuCores)} unit="cores" />
							<Stat label="memory" value={formatMb(node.memoryMb)} />
							<Stat label="disk" value={formatMb(node.diskMb)} />
						</PanelBody>
						<PanelFooter>
							<span>section A · hardware report</span>
							<span className="tabular-nums">{node.hostname}</span>
						</PanelFooter>
					</Panel>
					<Panel tag="B" label="Deployment counts">
						<PanelBody className="space-y-4">
							<ResourceBar label="queued" used={queued} total={Math.max(sortedDeploys.length, 1)} unit="" />
							<ResourceBar label="processing" used={processing} total={Math.max(sortedDeploys.length, 1)} unit="" />
							<ResourceBar label="completed" used={completed} total={Math.max(sortedDeploys.length, 1)} unit="" />
						</PanelBody>
					</Panel>
				</div>

				<Panel tag="C" label="Deployments on this node" caption={`${sortedDeploys.length} rows`}>
					{sortedDeploys.length === 0 ? (
						<PanelBody>
							<EmptyState
								title="Nothing deployed here yet"
								description="Queue a deployment from a project to send it to this node."
								action={
									<Button asChild size="sm">
										<Link href="/deployments/new">new deployment</Link>
									</Button>
								}
							/>
						</PanelBody>
					) : (
						<table className="w-full text-xs">
							<thead className="text-left">
								<tr className="border-b border-border text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
									<th className="px-4 py-2.5">status</th>
									<th className="px-4 py-2.5">name</th>
									<th className="px-4 py-2.5">branch</th>
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
										<td className="px-4 py-3 text-muted-foreground tabular-nums">{relativeTime(d._creationTime)}</td>
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

				<Panel tag="D" label="Identifiers">
					<PanelBody className="space-y-3">
						<CopyToken label="node id" value={node._id} />
						<CopyToken label="token hash" value={node.tokenHash} masked />
					</PanelBody>
				</Panel>

				<Panel tag="DZ" label="Danger zone" caption="irreversible" className="border-destructive/40">
					<PanelBody className="space-y-4 text-xs">
						<div className="space-y-1">
							<p className="text-foreground">Deregister this node</p>
							<p className="text-muted-foreground">
								Tears down the Cloudflare tunnel, removes all DNS records pointing at it, drops the node record and {sortedDeploys.length} deployment record{sortedDeploys.length === 1 ? "" : "s"}. The agent on the host stays installed but will stop receiving work.
							</p>
						</div>
						<ConfirmDeleteDialog
							resourceLabel="node"
							resourceName={node.name}
							triggerLabel="deregister node"
							description={
								<>
									Removes the Cloudflare tunnel, all routed DNS records, and {sortedDeploys.length} deployment record{sortedDeploys.length === 1 ? "" : "s"}. The agent binary on the VPS remains — uninstall it separately. This cannot be undone.
								</>
							}
							onConfirm={() => deleteNode({ id: node._id })}
							onSuccess={() => router.push("/nodes")}
						/>
					</PanelBody>
				</Panel>
			</div>
		</div>
	);
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="bp-label">{label}</span>
			<div className="flex items-baseline gap-2">
				<span className="font-mono text-3xl font-medium tabular-nums text-foreground">{value}</span>
				{unit && <span className="bp-caption text-[10px]">{unit}</span>}
			</div>
		</div>
	);
}

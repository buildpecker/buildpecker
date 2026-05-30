"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { StatusBadge } from "@/components/status-badge";
import { CopyToken } from "@/components/copy-token";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmRedeployDialog } from "@/components/confirm-redeploy-dialog";
import { EmptyState } from "@/components/empty-state";
import { CircleNotchIcon, GithubLogoIcon, HardDrivesIcon, FolderIcon, ProhibitIcon } from "@phosphor-icons/react";
import { relativeTime, shortId } from "@/lib/format";
import { DeploymentLogStream } from "@/components/deployment-log-stream";

export default function DeploymentDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params.id as Id<"deployments">;
	const dep = useQuery(api.deployments.queries.getDeploymentById, { id });
	const redoDeploymentToQueued = useMutation(api.deployments.mutations.setDeploymentStatus);
	const cancelDeployment = useMutation(api.deployments.mutations.cancelQueuedDeployment);
	const deleteDeployment = useAction(api.deployments.actions.deleteDeployment);
	const [redeploying, setRedeploying] = React.useState(false);
	const [cancelling, setCancelling] = React.useState(false);

	const handleCancel = async () => {
		setCancelling(true);
		try {
			await cancelDeployment({ id });
			toast.success("deployment cancelled");
		} catch (err) {
			toast.error("failed to cancel", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setCancelling(false);
		}
	};

	const handleRedeploy = async (id: Id<"deployments">, nodeId: Id<"nodes">) => {
		setRedeploying(true);
		try {
			await redoDeploymentToQueued({ id, nodeId, status: "queued" });
		} finally {
			setRedeploying(false);
		}
	}

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
					<DeploymentLogStream deploymentId={dep._id} />
					<PanelFooter>
						<span>section C · output</span>
						<span>loki · {dep._id.slice(0, 8)}</span>
					</PanelFooter>
				</Panel>

				<Panel tag="D" label="Identifiers">
					<PanelBody className="space-y-3">
						<CopyToken label="deployment id" value={dep._id} />
						{dep.imageUri && <CopyToken label="image uri" value={dep.imageUri} />}
					</PanelBody>
				</Panel>

				{(dep.status === "queued" || dep.status === "completed" || dep.status === "failed" || dep.status === "cancelled") && (
					<Panel tag="DZ" label="Actions" caption="deployment actions" className="border-destructive/40">
						<PanelBody className="flex flex-wrap items-center gap-3 text-xs">
							{dep.status === "queued" && (
								<Button
									variant="destructive"
									size="sm"
									onClick={handleCancel}
									disabled={cancelling}
								>
									{cancelling ? <CircleNotchIcon className="size-3.5 animate-spin" /> : <ProhibitIcon className="size-3.5" />}
									cancel
								</Button>
							)}
							<ConfirmDeleteDialog
								resourceLabel="deployment"
								resourceName={dep.name}
								triggerLabel={dep.status === "completed" ? "stop & delete" : "delete"}
								description={
									dep.status === "completed"
										? <>Signals the agent on <code className="text-foreground">{dep.node?.name ?? "node"}</code> to stop the running container, then removes this record. This cannot be undone.</>
										: <>Removes this deployment record. This cannot be undone.</>
								}
								onConfirm={() => deleteDeployment({ id })}
								onSuccess={() => router.push("/deployments")}
							/>
							{(dep.status == "failed" || dep.status == "completed" || dep.status == "cancelled") && (
								<ConfirmRedeployDialog
									resourceName={dep.name}
									disabled={redeploying}
									onConfirm={() => handleRedeploy(dep._id, dep.nodeId)}
								/>
							)}
						</PanelBody>
					</Panel>
				)}
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

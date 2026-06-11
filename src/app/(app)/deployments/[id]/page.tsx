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
import { Input } from "@/components/ui/input";
import { ConfirmRedeployDialog } from "@/components/confirm-redeploy-dialog";
import { EmptyState } from "@/components/empty-state";
import { CircleNotchIcon, GithubLogoIcon, HardDrivesIcon, FolderIcon, ProhibitIcon, CubeIcon, PulseIcon, GlobeIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { relativeTime, relativeTimeIntl, shortId } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import { DeploymentLogStream } from "@/components/deployment-log-stream";
import { PostInstallPanel } from "@/components/postinstall-panel";

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
	const now = useNow(1000);

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
							{dep.status === "completed" && (dep.type === "project" || !!dep.infra?.healthCheck) && (
								<span className="inline-flex items-center gap-1.5 normal-case">
									<PulseIcon
										className={`size-3 ${now - dep.lastHealthCheck < 90_000 ? "text-[var(--status-completed)]" : "text-[var(--status-failed)]"}`}
										weight={now - dep.lastHealthCheck < 90_000 ? "fill" : "regular"}
									/>
									<span>health · <span className="text-foreground">{relativeTimeIntl(dep.lastHealthCheck, now)}</span></span>
								</span>
							)}
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{dep.type === "infra" ? (
						<Panel tag="A" label="Template">
							{dep.infra ? (
								<PanelBody className="space-y-3 text-xs">
									<div className="flex items-center gap-2">
										<CubeIcon className="size-4 text-primary" />
										{dep.infra.template ? (
											<Link
												href={`/infras/${dep.infra.template._id}`}
												className="font-medium text-foreground hover:underline underline-offset-2"
											>
												{dep.infra.template.name}
											</Link>
										) : (
											<span className="font-medium text-foreground">unknown template</span>
										)}
										{dep.infra.template && (
											<span className="border border-border px-1.5 py-0.5 text-[10px] tracking-[0.1em] tabular-nums text-muted-foreground">
												{dep.infra.template.version}
											</span>
										)}
									</div>
									<Spec label="container" value={dep.infra.containerName} />
								</PanelBody>
							) : (
								<PanelBody><EmptyState title="Infra removed" /></PanelBody>
							)}
						</Panel>
					) : (
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
					)}

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

				{dep.type === "infra" && dep.infra && (
					<Panel tag="Y" label="Compose" caption="in use · this deployment">
						<PanelBody>
							<pre className="max-h-96 overflow-auto border border-border bg-card/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">
								{dep.infra.composeYaml}
							</pre>
						</PanelBody>
						<PanelFooter>
							<span>section Y · compose</span>
							<span className="tabular-nums">{dep.infra.composeYaml.split("\n").length} lines</span>
						</PanelFooter>
					</Panel>
				)}

				{dep.type === "infra" && dep.infra && dep.infra.postInstall && dep.infra.postInstall.length > 0 && (
					<PostInstallPanel
						deploymentId={dep._id}
						commands={dep.infra.postInstall}
						canRun={dep.status === "completed"}
					/>
				)}

				<Panel tag="C" label="Build output" caption="logs · stream">
					<DeploymentLogStream deploymentId={dep._id} />
					<PanelFooter>
						<span>section C · output</span>
						<span>loki · {dep._id.slice(0, 8)}</span>
					</PanelFooter>
				</Panel>

				{(dep.customDomainUrl || dep.publicUrl) && (
					<Panel tag="U" label="Public URL" caption="ingress · live">
						<PanelBody className="text-xs">
							<a
								href={`https://${dep.customDomainUrl ?? dep.publicUrl}`}
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
							>
								<GlobeIcon className="size-4 text-primary" />
								<span className="hover:underline underline-offset-2">{dep.customDomainUrl ?? dep.publicUrl}</span>
								<ArrowSquareOutIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
							</a>
						</PanelBody>
						<PanelFooter>
							<span>section U · public url</span>
							<span className="tabular-nums">https</span>
						</PanelFooter>
					</Panel>
				)}

				{dep.status === "completed" && (
					<CustomDomainPanel deploymentId={dep._id} current={dep.customDomainUrl} />
				)}

				{dep.routes && dep.routes.length > 0 && (
					<Panel tag="R" label="Public routes" caption="ingress · cloudflare">
						<PanelBody className="space-y-2 text-xs">
							{dep.routes.map((r) => (
								<div key={r.hostname} className="flex items-center justify-between gap-3 border-b border-border/50 pb-1.5">
									<a
										href={`https://${r.hostname}`}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-foreground hover:underline underline-offset-2"
									>
										{r.hostname}
									</a>
									<span className="bp-label whitespace-nowrap">{r.name} · :{r.containerPort}</span>
								</div>
							))}
						</PanelBody>
					</Panel>
				)}

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

function CustomDomainPanel({ deploymentId, current }: { deploymentId: Id<"deployments">; current?: string }) {
	const setCustomDomain = useAction(api.deployments.domains.setCustomDomain);
	const [value, setValue] = React.useState("");
	const [saving, setSaving] = React.useState(false);

	const host = (current ?? value).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "app.example.com";
	const labels = host.split(".").filter(Boolean);
	const recordName = labels.length <= 2 ? "@" : labels.slice(0, labels.length - 2).join(".");

	const save = async (domain: string) => {
		setSaving(true);
		try {
			await setCustomDomain({ id: deploymentId, customDomain: domain });
			toast.success(domain.trim() ? "custom domain set" : "custom domain removed");
			setValue("");
		} catch (err) {
			toast.error("failed to update domain", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Panel tag="X" label="Custom domain" caption="ingress · caddy">
			<PanelBody className="space-y-3 text-xs">
				{current && (
					<div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
						<a
							href={`https://${current}`}
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
						>
							<GlobeIcon className="size-4 text-primary" />
							<span className="hover:underline underline-offset-2">{current}</span>
							<ArrowSquareOutIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
						</a>
						<Button variant="ghost" size="sm" disabled={saving} onClick={() => save("")}>
							remove
						</Button>
					</div>
				)}
				<div className="flex items-center gap-2">
					<Input
						value={value}
						onChange={e => setValue(e.target.value)}
						placeholder="app.example.com"
						className="h-8 font-mono text-xs"
						onKeyDown={e => {
							if (e.key === "Enter" && value.trim() && !saving) save(value);
						}}
					/>
					<Button size="sm" disabled={saving || !value.trim()} onClick={() => save(value)}>
						{saving && <CircleNotchIcon className="size-3.5 animate-spin" />}
						{current ? "update" : "add"}
					</Button>
				</div>
				<div className="space-y-2">
					<span className="bp-label">required dns record</span>
					<div className="overflow-x-auto border border-border">
						<table className="w-full border-collapse text-[11px]">
							<thead>
								<tr className="bg-card/60 text-muted-foreground">
									<th className="px-2.5 py-1.5 text-left font-medium uppercase tracking-[0.08em]">Type</th>
									<th className="px-2.5 py-1.5 text-left font-medium uppercase tracking-[0.08em]">Name</th>
									<th className="px-2.5 py-1.5 text-left font-medium uppercase tracking-[0.08em]">Value</th>
									<th className="px-2.5 py-1.5 text-left font-medium uppercase tracking-[0.08em]">TTL</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-t border-border font-mono text-foreground">
									<td className="px-2.5 py-1.5">A</td>
									<td className="px-2.5 py-1.5 break-all">{recordName}</td>
									<td className="px-2.5 py-1.5 tabular-nums">82.197.73.103</td>
									<td className="px-2.5 py-1.5">60</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p className="bp-caption leading-relaxed">
						use the name exactly as shown ({recordName === "@" ? "@ for the root domain" : `just ${recordName}, not the full domain`}); some providers like cloudflare also accept the full domain. SSL is provisioned automatically. <b className="text-foreground">It might take some time (~1 mins past TTL of 60 seconds) to update the DNS records.</b>
					</p>
				</div>
			</PanelBody>
			<PanelFooter>
				<span>section X · custom domain</span>
				<span className="tabular-nums">a · 82.197.73.103</span>
			</PanelFooter>
		</Panel>
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

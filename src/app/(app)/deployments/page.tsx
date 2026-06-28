"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { PlusIcon, ArrowRightIcon, CircleNotchIcon, FunnelIcon } from "@phosphor-icons/react";
import { compactDuration, shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "queued", "processing", "completed", "failed", "cancelled", "deleting"] as const;
type Filter = (typeof FILTERS)[number];

const HEALTH_FRESH_MS = 90_000;

type DeploymentRow = NonNullable<ReturnType<typeof useQuery<typeof api.deployments.queries.getAllDeploymentsForUser>>>[number];

function useNow(intervalMs = 1000): number {
	const [now, setNow] = React.useState(() => Date.now());
	React.useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

function HealthTicker({ d, now }: { d: DeploymentRow; now: number }) {
	if (d.status !== "completed") {
		return <span className="text-muted-foreground/40">—</span>;
	}
	if (!d.infra?.healthCheck) {
		return (
			<span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
				<span className="size-1.5 rounded-full bg-muted-foreground/40" />
				no probe
			</span>
		);
	}
	const healthy = now - d.lastHealthCheck <= HEALTH_FRESH_MS;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 tabular-nums",
				healthy ? "text-[var(--status-completed)]" : "text-[var(--status-failed)]",
			)}
		>
			<span
				className={cn(
					"size-1.5 rounded-full",
					healthy ? "animate-pulse bg-[var(--status-completed)]" : "bg-[var(--status-failed)]",
				)}
			/>
			{healthy ? "healthy" : "stale"} · {compactDuration(now - d.lastHealthCheck)}
		</span>
	);
}

export default function DeploymentsListPage() {
	const user = useQuery(api.users.queries.current);
	const deployments = useQuery(
		api.deployments.queries.getAllDeploymentsForUser,
		user ? { userId: user._id } : "skip"
	);

	const loading = !user || !deployments;

	const projectDeps = (deployments ?? []).filter((d) => d.type !== "infra");
	const infraDeps = (deployments ?? []).filter((d) => d.type === "infra");

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

			<div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">queue · build log</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{loading ? "—" : `${deployments.length} total`}</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Deployments</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Every deploy starts queued, gets picked up by its target node, processes, then completes.
					</p>
				</header>

				<DeploymentSection
					tag="P"
					sectionLabel="Project deployments"
					kind="project"
					rows={projectDeps}
					loading={loading}
				/>

				<DeploymentSection
					tag="I"
					sectionLabel="Infrastructure deployments"
					kind="infra"
					rows={infraDeps}
					loading={loading}
				/>
			</div>
		</div>
	);
}

function DeploymentSection({
	tag,
	sectionLabel,
	kind,
	rows,
	loading,
}: {
	tag: string;
	sectionLabel: string;
	kind: "project" | "infra";
	rows: DeploymentRow[];
	loading: boolean;
}) {
	const [filter, setFilter] = React.useState<Filter>("all");
	const now = useNow();

	const counts = React.useMemo(() => {
		const base = { all: rows.length, queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0, deleting: 0 };
		rows.forEach((d) => {
			base[d.status]++;
		});
		return base;
	}, [rows]);

	const filtered = filter === "all" ? rows : rows.filter((d) => d.status === filter);
	const sourceHeader = kind === "infra" ? "template" : "project";

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3 border border-border bg-card/40 px-3 py-2">
				<div className="flex items-center gap-1">
					<FunnelIcon className="size-3 text-muted-foreground" />
					<span className="bp-label">{kind} filter</span>
				</div>
				<div className="flex items-center gap-px">
					{FILTERS.map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFilter(f)}
							className={cn(
								"flex items-center gap-2 border border-border px-3 py-1 text-[10px] tracking-[0.14em] uppercase transition-colors",
								filter === f
									? "border-primary bg-primary text-primary-foreground"
									: "bg-card/30 text-muted-foreground hover:text-foreground",
							)}
						>
							<span>{f}</span>
							<span className="tabular-nums">{counts[f]}</span>
						</button>
					))}
				</div>
			</div>

			<Panel tag={tag} label={sectionLabel} caption={`${filtered.length} rows`}>
				{loading ? (
					<PanelBody className="flex items-center justify-center py-16 text-muted-foreground">
						<CircleNotchIcon className="size-4 animate-spin" />
					</PanelBody>
				) : filtered.length === 0 ? (
					<PanelBody>
						<EmptyState
							title={
								filter === "all"
									? kind === "infra"
										? "No infrastructure deployments"
										: "No project deployments"
									: `No ${filter} ${kind} deployments`
							}
							description={
								kind === "infra"
									? "Deploy a template from the Infrastructure catalog to a node."
									: "Queue your first deploy by selecting a project and target node."
							}
							action={
								<Button asChild size="sm">
									<Link href={kind === "infra" ? "/infras" : "/deployments/new"}>
										{kind === "infra" ? "browse templates" : "new deployment"}
									</Link>
								</Button>
							}
						/>
					</PanelBody>
				) : (
					<table className="w-full text-xs">
						<thead className="text-left">
							<tr className="border-b border-border text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
								<th className="w-12 px-4 py-2.5 tabular-nums">#</th>
								<th className="px-4 py-2.5">status</th>
								<th className="px-4 py-2.5">deployment</th>
								<th className="px-4 py-2.5">{sourceHeader}</th>
								{kind === "infra" ? (
									<th className="px-4 py-2.5">visibility</th>
								) : (
									<th className="px-4 py-2.5">branch</th>
								)}
								<th className="px-4 py-2.5">health</th>
								<th className="w-10 px-4 py-2.5" />
							</tr>
						</thead>
						<tbody>
							{filtered.map((d, i) => (
								<tr key={d._id} className="border-b border-border/60 hover:bg-muted/30">
									<td className="px-4 py-3 text-[10px] tabular-nums text-muted-foreground">
										{String(i + 1).padStart(3, "0")}
									</td>
									<td className="px-4 py-3"><StatusBadge status={d.status} /></td>
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<span className="font-medium text-foreground">{d.name}</span>
											<span className="bp-caption text-[10px]">{shortId(d._id)}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{kind === "infra" ? (
											<div className="flex flex-col">
												<span>{d.infra?.template?.name ?? <span className="text-muted-foreground/60">unknown</span>}</span>
												{d.infra?.containerName && (
													<span className="bp-caption text-[10px]">{d.infra.containerName}</span>
												)}
											</div>
										) : (
											d.project?.name ?? <span className="text-muted-foreground/60">unknown</span>
										)}
									</td>
									{kind === "infra" ? (
										<td className="px-4 py-3 text-muted-foreground">
											{d.routes && d.routes.length > 0 ? (
												<span className="text-[var(--status-completed)]">public · {d.routes.length}</span>
											) : (
												<span className="text-muted-foreground/60">local</span>
											)}
										</td>
									) : (
										<td className="px-4 py-3 text-muted-foreground tabular-nums">{d.branch || "—"}</td>
									)}
									<td className="px-4 py-3"><HealthTicker d={d} now={now} /></td>
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
				<PanelFooter>
					<span>section {tag} · {kind} deployments</span>
					<span className="tabular-nums">{loading ? "—" : `${filtered.length}/${counts.all}`}</span>
				</PanelFooter>
			</Panel>
		</div>
	);
}

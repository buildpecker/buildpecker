"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PlusIcon, ArrowRightIcon, CircleNotchIcon, HardDrivesIcon, PulseIcon } from "@phosphor-icons/react";
import { formatMb, relativeTimeIntl, shortId } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import { NodeMetrics } from "@/components/node-metrics";

export default function NodesListPage() {
	const user = useQuery(api.users.queries.current);
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");
	const now = useNow(1000);

	const loading = !user || !nodes;

	return (
		<div className="flex flex-col">
			<Topbar
				action={
					<Button asChild size="sm">
						<Link href="/nodes/new" className="gap-1.5">
							<PlusIcon className="size-3.5" /> register node
						</Link>
					</Button>
				}
			/>

			<div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">node fleet</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{loading ? "—" : `${nodes.length} hosts`}</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Nodes</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Hardware you own. Each node receives queued deployments, runs the builder, and reports back.
					</p>
				</header>

				<Panel tag="N" label="Node register" caption="sheet 03/04">
					{loading ? (
						<PanelBody className="flex items-center justify-center py-16 text-muted-foreground">
							<CircleNotchIcon className="size-4 animate-spin" />
						</PanelBody>
					) : nodes.length === 0 ? (
						<PanelBody>
							<EmptyState
								title="No nodes registered"
								description="Generate a one-time registration token, paste it into your node binary, and it will appear here once it phones home."
								action={
									<Button asChild size="sm">
										<Link href="/nodes/new">register node</Link>
									</Button>
								}
							/>
						</PanelBody>
					) : (
						<div className="flex flex-col gap-px bg-border">
							{nodes.map((n, i) => (
								<Link
									key={n._id}
									href={`/nodes/${n._id}`}
									className="bp-row group grid grid-cols-1 gap-px bg-border transition-colors md:grid-cols-[minmax(260px,340px)_1fr]"
								>
									{/* left: identity + capacity */}
									<div className="flex flex-col gap-4 bg-card p-5 group-hover:bg-muted/40">
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-2.5">
												<div className="flex size-8 items-center justify-center border border-border bg-background">
													<HardDrivesIcon className="size-4 text-primary" />
												</div>
												<div className="flex flex-col">
													<span className="text-xs font-medium tracking-[0.04em] text-foreground">{n.name}</span>
													<span className="bp-caption text-[10px]">{n.hostname}</span>
												</div>
											</div>
											<span className="bp-caption text-[9px] tabular-nums">{String(i + 1).padStart(3, "0")}</span>
										</div>

										<dl className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 text-[10px] tracking-[0.04em] uppercase">
											<div className="flex flex-col gap-0.5">
												<dt className="bp-caption">cpu</dt>
												<dd className="text-sm tabular-nums text-foreground">{n.cpuCores}</dd>
											</div>
											<div className="flex flex-col gap-0.5">
												<dt className="bp-caption">memory</dt>
												<dd className="text-sm tabular-nums text-foreground">{formatMb(n.memoryMb)}</dd>
											</div>
											<div className="flex flex-col gap-0.5">
												<dt className="bp-caption">disk</dt>
												<dd className="text-sm tabular-nums text-foreground">{formatMb(n.diskMb)}</dd>
											</div>
										</dl>

										<div className="flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
											<span className="inline-flex items-center gap-1.5">
												<PulseIcon
													className={`size-3 ${now - n.lastHeartbeat < 60_000 ? "text-[var(--status-completed)]" : "text-muted-foreground"}`}
													weight={now - n.lastHeartbeat < 60_000 ? "fill" : "regular"}
												/>
												<span className="bp-caption text-[10px] normal-case tracking-[0.04em]">
													last heartbeat {relativeTimeIntl(n.lastHeartbeat, now)}
												</span>
											</span>
										</div>
										<div className="flex items-end justify-between text-[10px] tabular-nums text-muted-foreground">
											<span>id · {shortId(n._id)}</span>
											<span className="inline-flex items-center gap-1 group-hover:text-primary">
												inspect <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
											</span>
										</div>
									</div>

									{/* right: live metric graphs */}
									<div className="group-hover:bg-muted/40">
										<NodeMetrics nodeId={n._id} />
									</div>
								</Link>
							))}
						</div>
					)}
					<PanelFooter>
						<span>section N · fleet register</span>
						<span className="tabular-nums">{loading ? "—" : `${nodes.length} hosts`}</span>
					</PanelFooter>
				</Panel>
			</div>
		</div>
	);
}

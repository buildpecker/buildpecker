"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PlusIcon, ArrowRightIcon, GithubLogoIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { relativeTime, shortId } from "@/lib/format";

export default function ProjectsListPage() {
	const user = useQuery(api.users.queries.current);
	const projects = useQuery(api.projects.queries.getAllProjectsForUser, user ? { userId: user._id } : "skip");

	const loading = !user || !projects;

	return (
		<div className="flex flex-col">
			<Topbar
				action={
					<Button asChild size="sm">
						<Link href="/projects/new" className="gap-1.5">
							<PlusIcon className="size-3.5" /> new project
						</Link>
					</Button>
				}
			/>
			<div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">repositories</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{loading ? "—" : `${projects.length} indexed`}</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Projects</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Source-of-truth repositories. Each project carries its own environment vault and deploys to any registered node.
					</p>
				</header>

				<Panel tag="P" label="Project register" caption="sheet 02/04">
					{loading ? (
						<PanelBody className="flex items-center justify-center py-16 text-muted-foreground">
							<CircleNotchIcon className="size-4 animate-spin" />
						</PanelBody>
					) : projects.length === 0 ? (
						<PanelBody>
							<EmptyState
								title="No projects yet"
								description="Paste a GitHub URL to register your first deployable repository."
								action={
									<Button asChild size="sm">
										<Link href="/projects/new">create project</Link>
									</Button>
								}
							/>
						</PanelBody>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead className="text-left">
									<tr className="border-b border-border text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
										<th className="w-10 px-4 py-2.5 tabular-nums">#</th>
										<th className="px-4 py-2.5">name</th>
										<th className="px-4 py-2.5">framework</th>
										<th className="px-4 py-2.5">branch</th>
										<th className="px-4 py-2.5">repo</th>
										<th className="px-4 py-2.5">id</th>
										<th className="px-4 py-2.5">created</th>
										<th className="w-10 px-4 py-2.5" />
									</tr>
								</thead>
								<tbody>
									{projects.map((p, i) => (
										<tr key={p._id} className="border-b border-border/60 transition-colors hover:bg-muted/30">
											<td className="px-4 py-3 text-[10px] tabular-nums text-muted-foreground">
												{String(i + 1).padStart(3, "0")}
											</td>
											<td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
											<td className="px-4 py-3 text-muted-foreground">
												{p.framework && p.framework !== "Unknown" ? (
													<span className="border border-border px-1.5 py-0.5 text-[10px] tracking-[0.06em] uppercase">
														{p.framework}
													</span>
												) : (
													<span className="text-muted-foreground/60">unknown</span>
												)}
											</td>
											<td className="px-4 py-3 text-muted-foreground">{p.defaultBranch}</td>
											<td className="px-4 py-3">
												<a
													href={p.repoUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex max-w-[260px] items-center gap-1.5 truncate text-muted-foreground hover:text-foreground"
												>
													<GithubLogoIcon className="size-3.5 shrink-0" />
													<span className="truncate">{p.repoUrl.replace(/^https?:\/\//, "")}</span>
												</a>
											</td>
											<td className="px-4 py-3 text-[10px] tabular-nums text-muted-foreground">
												{shortId(p._id)}
											</td>
											<td className="px-4 py-3 text-[10px] tabular-nums text-muted-foreground">
												{relativeTime(p._creationTime)}
											</td>
											<td className="px-4 py-3">
												<Link
													href={`/projects/${p._id}`}
													className="inline-flex size-7 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary"
												>
													<ArrowRightIcon className="size-3.5" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
					<PanelFooter>
						<span>section P · projects register</span>
						<span className="tabular-nums">{loading ? "—" : `${projects.length} rows`}</span>
					</PanelFooter>
				</Panel>
			</div>
		</div>
	);
}

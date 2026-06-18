"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { EmptyState } from "@/components/empty-state";
import { CircleNotchIcon, CubeIcon, ArrowRightIcon } from "@phosphor-icons/react";

export default function InfrasPage() {
	const templates = useQuery(api.infra.queries.getAllInfraTemplates);
	const loading = templates === undefined;

	return (
		<div className="flex flex-col">
			<Topbar />

			<div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">catalog · templates</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption tabular-nums">{loading ? "—" : `${templates.length} total`}</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Infrastructure</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Pick a template to customize its compose and host on any node. Editing a template&apos;s compose only affects your own deployment.
					</p>
				</header>

				<Panel tag="T" label="Template catalog" caption={`${loading ? "—" : templates.length} templates`}>
					{loading ? (
						<PanelBody className="flex items-center justify-center py-16 text-muted-foreground">
							<CircleNotchIcon className="size-4 animate-spin" />
						</PanelBody>
					) : templates.length === 0 ? (
						<PanelBody>
							<EmptyState
								title="No templates yet"
								description="Seed infra templates to get started."
							/>
						</PanelBody>
					) : (
						<div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
							{templates.map((t) => (
								<Link
									key={t._id}
									href={`/infras/${t._id}`}
									className="group flex flex-col gap-4 bg-card p-4 transition-colors hover:bg-muted/30"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex size-11 items-center justify-center border border-border bg-card/60">
											{t.logoUrl ? (
												<Image src={t.logoUrl} alt="" width={28} height={28} unoptimized className="size-7 object-contain" />
											) : (
												<CubeIcon className="size-5 text-muted-foreground" />
											)}
										</div>
										<ArrowRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
									</div>
									<div className="flex flex-col gap-1">
										<div className="flex items-center gap-2">
											<span className="font-medium text-foreground">{t.name}</span>
											<span className="border border-border px-1.5 py-0.5 text-[10px] tracking-[0.1em] tabular-nums text-muted-foreground">
												{t.version}
											</span>
										</div>
										<span className="bp-caption text-[10px]">{t.identifier}</span>
									</div>
								</Link>
							))}
						</div>
					)}
					<PanelFooter>
						<span>section T · template catalog</span>
						<span className="tabular-nums">{loading ? "—" : templates.length}</span>
					</PanelFooter>
				</Panel>
			</div>
		</div>
	);
}

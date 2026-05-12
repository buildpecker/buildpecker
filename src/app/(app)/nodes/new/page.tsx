"use client";

import * as React from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { Button } from "@/components/ui/button";
import { CopyToken } from "@/components/copy-token";
import { CircleNotchIcon, LightningIcon, TerminalIcon } from "@phosphor-icons/react";

export default function NewNodePage() {
	const user = useQuery(api.users.queries.current);
	const generate = useAction(api.nodes.nodejs.actions.createRegistrationToken);
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");

	const [token, setToken] = React.useState<string | null>(null);
	const [generating, setGenerating] = React.useState(false);
	const [issuedAt, setIssuedAt] = React.useState<number | null>(null);
	const [now, setNow] = React.useState<number>(() => Date.now());

	React.useEffect(() => {
		if (!issuedAt) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, [issuedAt]);

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const t = await generate();
			setToken(t);
			setIssuedAt(Date.now());
			setNow(Date.now());
		} catch (err) {
			toast.error("failed to generate token", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setGenerating(false);
		}
	};

	const expiresIn = issuedAt ? Math.max(0, 600 - Math.floor((now - issuedAt) / 1000)) : null;

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">new · node</span>
						<div className="h-px flex-1 bg-border" />
						<span className="bp-caption">step 1 / 2</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Register a node</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Generate an ephemeral registration token. Paste it into the node binary running on your VPS.
						The node exchanges it for a permanent token, hashes it, and starts polling for deployments.
					</p>
				</header>

				<Panel tag="01" label="Generate token">
					<PanelBody className="space-y-5">
						<div className="flex items-center justify-between gap-4">
							<div className="flex flex-col">
								<span className="text-xs text-foreground">Single-use, expires in 10 minutes.</span>
								<span className="bp-caption">stored in redis; consumed on first node call</span>
							</div>
							<Button onClick={handleGenerate} disabled={generating || !user}>
								{generating ? (
									<>
										<CircleNotchIcon className="size-4 animate-spin" /> generating
									</>
								) : (
									<>
										<LightningIcon className="size-4" weight="fill" /> generate
									</>
								)}
							</Button>
						</div>

						{token && (
							<div className="space-y-3">
								<CopyToken label="registration token" value={token} masked />
								<div className="flex items-center justify-between bg-card/40 border border-border px-3 py-2 text-[10px] tracking-[0.14em] uppercase">
									<span className="text-muted-foreground">expires</span>
									<span className="tabular-nums text-foreground">
										{expiresIn ? `~${Math.floor(expiresIn / 60)}m ${expiresIn % 60}s` : "—"}
									</span>
								</div>
							</div>
						)}
					</PanelBody>
				</Panel>

				<Panel tag="02" label="Paste into your node">
					<PanelBody className="space-y-3 text-xs">
						<p className="leading-relaxed text-muted-foreground">
							On the VPS running the forge node binary, run:
						</p>
						<pre className="overflow-x-auto border border-border bg-card/40 px-4 py-3 font-mono text-[11px] tabular-nums leading-relaxed">
							<span className="text-muted-foreground">$</span> forge-node register --token{" "}
							<span className="text-primary">{token ?? "<paste-token-here>"}</span>
						</pre>
						<p className="flex items-center gap-1.5 leading-relaxed text-muted-foreground">
							<TerminalIcon className="size-3.5" />
							The binary will report cpu, memory, disk, and hostname back to forge automatically.
						</p>
					</PanelBody>
				</Panel>

				<Panel tag="03" label="Awaiting handshake" caption={`${nodes?.length ?? 0} nodes online`}>
					<PanelBody className="space-y-3 text-xs">
						{nodes && nodes.length > 0 ? (
							<ul className="divide-y divide-border">
								{nodes.slice(0, 3).map((n) => (
									<li key={n._id} className="flex items-center justify-between py-2">
										<span className="font-medium text-foreground">{n.name}</span>
										<span className="bp-caption tabular-nums">{n.hostname}</span>
									</li>
								))}
							</ul>
						) : (
							<p className="text-muted-foreground">Once your node calls home, it will appear here automatically.</p>
						)}
					</PanelBody>
					<PanelFooter>
						<span>section · live feed</span>
						<Link href="/nodes" className="hover:text-foreground">
							view fleet →
						</Link>
					</PanelFooter>
				</Panel>
			</div>
		</div>
	);
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody, PanelFooter } from "@/components/blueprint/panel";
import { CopyToken } from "@/components/copy-token";
import { ComposeEditor } from "@/components/compose-editor";
import { EnvEditor } from "@/components/env-editor";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CircleNotchIcon,
	CubeIcon,
	ArrowCounterClockwiseIcon,
	RocketLaunchIcon,
} from "@phosphor-icons/react";
import { formatMb } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function InfraTemplateDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params.id as Id<"infraTemplates">;

	const template = useQuery(api.infra.queries.getInfraTemplateById, { id });
	const user = useQuery(api.users.queries.current);
	const nodes = useQuery(api.nodes.queries.getAllNodesForUser, user ? { userId: user._id } : "skip");

	const createInfraContainer = useMutation(api.infra.mutations.createInfraContainer);
	const createInfraEnvironment = useMutation(api.infra.mutations.createInfraEnvironment);
	const createSecrets = useAction(api.environments.actions.createSecrets);
	const deployInfra = useAction(api.infra.actions.deployInfra);

	const [yaml, setYaml] = React.useState<string | null>(null);
	const [containerName, setContainerName] = React.useState("");
	const [nodeId, setNodeId] = React.useState<Id<"nodes"> | undefined>();
	const [envString, setEnvString] = React.useState("");
	const [isPublic, setIsPublic] = React.useState(false);
	const [deploying, setDeploying] = React.useState(false);

	React.useEffect(() => {
		if (template && yaml === null) {
			setYaml(template.composeYaml);
			setContainerName(`${template.identifier}-${Math.floor(Math.random() * 5000)}`);
		}
	}, [template, yaml]);

	if (template === undefined) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="flex items-center justify-center px-6 py-16 text-muted-foreground">
					<CircleNotchIcon className="size-4 animate-spin" />
				</div>
			</div>
		);
	}

	if (template === null) {
		return (
			<div className="flex flex-col">
				<Topbar />
				<div className="mx-auto w-full max-w-3xl px-6 py-12">
					<EmptyState
						title="Template not found"
						action={
							<Button asChild variant="ghost" size="sm">
								<Link href="/infras">back to catalog</Link>
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	const dirty = yaml !== null && yaml !== template.composeYaml;
	const noNodes = nodes?.length === 0;
	const ready = !!user && !!nodeId && containerName.trim() !== "" && yaml !== null;

	const handleDeploy = async () => {
		if (!ready || !user || !nodeId || yaml === null) return;
		setDeploying(true);
		try {
			const containerId = await createInfraContainer({
				ownerId: user._id,
				nodeId,
				templateId: id,
				containerName: containerName.trim(),
				composeYaml: yaml,
			});
			if (envString.trim() !== "") {
				const envId = await createInfraEnvironment({ id: containerId });
				await createSecrets({ envId, envString, kind: "infra" });
			}
			const depId = await deployInfra({ nodeId, infraId: containerId, isPublic, status: "queued" });
			toast.success("infra deployment queued");
			router.push(`/deployments/${depId}`);
		} catch (err) {
			toast.error("failed to deploy", {
				description: err instanceof Error ? err.message : String(err),
			});
			setDeploying(false);
		}
	};

	return (
		<div className="flex flex-col">
			<Topbar />
			<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<header className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<span className="bp-label">template · {template.identifier}</span>
						<div className="h-px flex-1 bg-border" />
						<Button asChild variant="ghost" size="sm">
							<Link href="/infras">back</Link>
						</Button>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center border border-border bg-card/60">
							{template.logoUrl ? (
								<img src={template.logoUrl} alt="" className="size-7 object-contain" />
							) : (
								<CubeIcon className="size-5 text-muted-foreground" />
							)}
						</div>
						<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">{template.name}</h1>
						<span className="border border-border px-1.5 py-0.5 text-[10px] tracking-[0.1em] tabular-nums text-muted-foreground">
							{template.version}
						</span>
					</div>
				</header>

				<Panel tag="A" label="Compose" caption="editable · this deployment">
					<PanelBody className="space-y-3">
						<p className="text-[11px] leading-relaxed text-muted-foreground">
							Edit the compose for your own deployment. Changes here never modify the original template.
						</p>
						<ComposeEditor value={yaml ?? ""} onChange={setYaml} />
					</PanelBody>
					<PanelFooter>
						<span>{dirty ? "modified · not saved" : "matches template"}</span>
						<Button
							variant="ghost"
							size="sm"
							disabled={!dirty}
							onClick={() => setYaml(template.composeYaml)}
							className="gap-1.5"
						>
							<ArrowCounterClockwiseIcon className="size-3.5" /> reset
						</Button>
					</PanelFooter>
				</Panel>

				<Panel tag="B" label="Deploy" caption="target node">
					{noNodes ? (
						<PanelBody>
							<EmptyState
								title="No nodes available"
								description="Register a node before deploying infrastructure."
								action={
									<Button asChild size="sm">
										<Link href="/nodes/new">register node</Link>
									</Button>
								}
							/>
						</PanelBody>
					) : (
						<>
							<PanelBody className="space-y-4">
								<div className="flex flex-col gap-2">
									<label className="bp-label">container name</label>
									<Input
										value={containerName}
										onChange={(e) => setContainerName(e.target.value)}
										placeholder="my-postgres"
										className="bg-card/60"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="bp-label">node</label>
									<Select value={nodeId ?? ""} onValueChange={(v) => setNodeId(v as Id<"nodes">)}>
										<SelectTrigger className="w-full border-border bg-card/60">
											<SelectValue placeholder="select a node" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{(nodes ?? []).map((n) => (
													<SelectItem key={n._id} value={n._id}>
														{n.name} · {n.hostname} · {formatMb(n.memoryMb)}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-2">
									<label className="bp-label">visibility</label>
									<div className="flex items-center gap-px">
										{([
											["local", false, "Local to node — reachable only on the host"],
											["public", true, "Public — routed to the internet via ingress"],
										] as const).map(([label, val, hint]) => (
											<button
												key={label}
												type="button"
												onClick={() => setIsPublic(val)}
												className={cn(
													"flex-1 border border-border px-3 py-2 text-left text-[11px] transition-colors",
													isPublic === val
														? "border-primary bg-primary text-primary-foreground"
														: "bg-card/30 text-muted-foreground hover:text-foreground",
												)}
											>
												<span className="block text-[10px] tracking-[0.14em] uppercase">{label}</span>
												<span className="block text-[10px] opacity-80">{hint}</span>
											</button>
										))}
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<p className="text-[11px] leading-relaxed text-muted-foreground">
										Optional KEY=VALUE pairs, one per line. Encrypted at rest with AES-256-GCM, injected into every service.
									</p>
									<EnvEditor value={envString} onChange={setEnvString} />
								</div>
							</PanelBody>
							<PanelFooter className="justify-end">
								<Button size="sm" disabled={!ready || deploying} onClick={handleDeploy} className="gap-1.5">
									{deploying ? (
										<>
											<CircleNotchIcon className="size-3.5 animate-spin" /> deploying
										</>
									) : (
										<>
											<RocketLaunchIcon className="size-3.5" /> deploy to node
										</>
									)}
								</Button>
							</PanelFooter>
						</>
					)}
				</Panel>

				<Panel tag="C" label="Identifiers">
					<PanelBody className="space-y-3">
						<CopyToken label="identifier" value={template.identifier} />
						<CopyToken label="template id" value={template._id} />
					</PanelBody>
				</Panel>
			</div>
		</div>
	);
}

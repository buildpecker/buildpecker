"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { formatMb } from "@/lib/format";
import { cn } from "@/lib/utils";

function slugifyPreview(input: string): string {
	return (
		input
			.toLowerCase()
			.replace(/[^a-z0-9-]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "") || "container"
	);
}

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
	const [config, setConfig] = React.useState<string | null>(null);
	const [containerName, setContainerName] = React.useState("");
	const [nodeId, setNodeId] = React.useState<Id<"nodes"> | undefined>();
	const [envString, setEnvString] = React.useState("");
	const [isPublic, setIsPublic] = React.useState(false);
	const [publicPorts, setPublicPorts] = React.useState<{ name: string; containerPort: string }[]>([
		{ name: "", containerPort: "" },
	]);
	const [postInstall, setPostInstall] = React.useState<{ name: string; service: string; command: string }[] | null>(null);
	const [healthCheck, setHealthCheck] = React.useState<{ service: string; command: string }>({ service: "", command: "" });
	const [deploying, setDeploying] = React.useState(false);
	const [nameSuffix] = React.useState(() => Math.floor(Math.random() * 5000));

	if (template && yaml === null) {
		setYaml(template.composeYaml);
		setConfig(template.config ?? "");
		setContainerName(`${template.identifier}-${nameSuffix}`);
		setPostInstall(
			(template.postInstall ?? []).map((c) => ({ name: c.name, service: c.service, command: c.command })),
		);
		setHealthCheck({
			service: template.healthCheck?.service ?? "",
			command: template.healthCheck?.command ?? "",
		});
	}

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
	const hasConfig = !!template.configFileName;
	const configDirty = hasConfig && config !== null && config !== (template.config ?? "");
	const noNodes = nodes?.length === 0;
	const canBePublic = !!template.canBePublic;
	const goingPublic = canBePublic && isPublic;
	const validPorts = publicPorts
		.map((p) => ({ name: p.name.trim(), containerPort: Number(p.containerPort) }))
		.filter((p) => p.name !== "" && Number.isInteger(p.containerPort) && p.containerPort > 0);
	const ready =
		!!user &&
		!!nodeId &&
		containerName.trim() !== "" &&
		yaml !== null &&
		(!goingPublic || validPorts.length > 0);

	const updatePort = (i: number, patch: Partial<{ name: string; containerPort: string }>) =>
		setPublicPorts((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
	const addPort = () => setPublicPorts((prev) => [...prev, { name: "", containerPort: "" }]);
	const removePort = (i: number) => setPublicPorts((prev) => prev.filter((_, idx) => idx !== i));

	const validPostInstall = (postInstall ?? [])
		.map((c) => ({ name: c.name.trim(), service: c.service.trim(), command: c.command.trim() }))
		.filter((c) => c.name !== "" && c.service !== "" && c.command !== "");
	const updateCmd = (i: number, patch: Partial<{ name: string; service: string; command: string }>) =>
		setPostInstall((prev) => (prev ?? []).map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
	const addCmd = () => setPostInstall((prev) => [...(prev ?? []), { name: "", service: "", command: "" }]);
	const removeCmd = (i: number) => setPostInstall((prev) => (prev ?? []).filter((_, idx) => idx !== i));

	const validHealthCheck =
		healthCheck.command.trim() !== ""
			? { service: healthCheck.service.trim(), command: healthCheck.command.trim() }
			: undefined;

	const handleDeploy = async () => {
		if (!ready || !user || !nodeId || yaml === null) return;
		setDeploying(true);
		try {
			const containerId = await createInfraContainer({
				nodeId,
				templateId: id,
				containerName: containerName.trim(),
				composeYaml: yaml,
				postInstall: validPostInstall.length > 0 ? validPostInstall : undefined,
				healthCheck: validHealthCheck,
				configFileName: hasConfig ? template.configFileName : undefined,
				config: hasConfig ? (config ?? "") : undefined,
			});
			if (envString.trim() !== "") {
				const envId = await createInfraEnvironment({ id: containerId });
				await createSecrets({ envId, envString, kind: "infra" });
			}
			const depId = await deployInfra({
				nodeId,
				infraId: containerId,
				isPublic: goingPublic,
				ports: goingPublic ? validPorts : undefined,
				status: "queued",
			});
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
								<Image src={template.logoUrl} alt="" width={28} height={28} unoptimized className="size-7 object-contain" />
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

				{hasConfig && (
					<Panel tag="F" label="Config" caption={`editable · ${template.configFileName}`}>
						<PanelBody className="space-y-3">
							<p className="text-[11px] leading-relaxed text-muted-foreground">
								Edit the <code className="text-foreground">{template.configFileName}</code> mounted into this deployment. Changes here never modify the original template.
							</p>
							<ComposeEditor
								value={config ?? ""}
								onChange={setConfig}
								label={`config · ${template.configFileName}`}
								placeholder=""
							/>
						</PanelBody>
						<PanelFooter>
							<span>{configDirty ? "modified · not saved" : "matches template"}</span>
							<Button
								variant="ghost"
								size="sm"
								disabled={!configDirty}
								onClick={() => setConfig(template.config ?? "")}
								className="gap-1.5"
							>
								<ArrowCounterClockwiseIcon className="size-3.5" /> reset
							</Button>
						</PanelFooter>
					</Panel>
				)}

				<Panel tag="P" label="Postinstall" caption="run on demand · after deploy">
					<PanelBody className="space-y-3">
						<p className="text-[11px] leading-relaxed text-muted-foreground">
							Commands you can run on demand against this deployment once it is live (e.g. generate an
							admin key, seed a database). Each runs inside a compose service via <code className="text-foreground">docker compose exec</code>.
							Output is shown temporarily and never written to permanent logs.
						</p>
						{(postInstall ?? []).length === 0 ? (
							<p className="text-[11px] text-muted-foreground/70">No postinstall commands defined.</p>
						) : (
							<div className="flex flex-col gap-3">
								{(postInstall ?? []).map((c, i) => (
									<div key={i} className="flex flex-col gap-2 border border-dashed border-border bg-card/40 px-3 py-3">
										<div className="flex items-center gap-2">
											<Input
												value={c.name}
												onChange={(e) => updateCmd(i, { name: e.target.value })}
												placeholder="generate admin key"
												className="bg-card/60"
											/>
											<Input
												value={c.service}
												onChange={(e) => updateCmd(i, { service: e.target.value })}
												placeholder="service"
												className="w-40 bg-card/60"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												onClick={() => removeCmd(i)}
												aria-label="remove command"
											>
												<TrashIcon className="size-3.5" />
											</Button>
										</div>
										<Input
											value={c.command}
											onChange={(e) => updateCmd(i, { command: e.target.value })}
											placeholder="npx convex run ..."
											className="bg-card/60 font-mono text-[11px]"
										/>
									</div>
								))}
							</div>
						)}
						<Button type="button" variant="outline" size="sm" onClick={addCmd} className="gap-1.5 self-start">
							<PlusIcon className="size-3.5" /> add command
						</Button>
					</PanelBody>
					<PanelFooter>
						<span className="tabular-nums">{validPostInstall.length} command{validPostInstall.length === 1 ? "" : "s"}</span>
						<Button
							variant="ghost"
							size="sm"
							disabled={!template.postInstall || template.postInstall.length === 0}
							onClick={() =>
								setPostInstall(
									(template.postInstall ?? []).map((c) => ({ name: c.name, service: c.service, command: c.command })),
								)
							}
							className="gap-1.5"
						>
							<ArrowCounterClockwiseIcon className="size-3.5" /> reset
						</Button>
					</PanelFooter>
				</Panel>

				<Panel tag="H" label="Health check" caption="periodic · liveness probe">
					<PanelBody className="space-y-3">
						<p className="text-[11px] leading-relaxed text-muted-foreground">
							A command run periodically inside a compose service via <code className="text-foreground">docker compose exec</code>.
							Exit code <code className="text-foreground">0</code> marks the deployment healthy (e.g.
							<code className="text-foreground"> pg_isready</code>, <code className="text-foreground">redis-cli ping</code>).
							Leave the service blank to run the command on the host instead. Leave both blank to skip health checks for non-probeable infra.
						</p>
						<div className="flex items-center gap-2">
							<Input
								value={healthCheck.service}
								onChange={(e) => setHealthCheck((prev) => ({ ...prev, service: e.target.value }))}
								placeholder="service"
								className="w-40 bg-card/60"
							/>
							<Input
								value={healthCheck.command}
								onChange={(e) => setHealthCheck((prev) => ({ ...prev, command: e.target.value }))}
								placeholder="command (e.g: pg_isready -U postgres)"
								className="flex-1 bg-card/60 font-mono text-[11px]"
							/>
						</div>
					</PanelBody>
					<PanelFooter>
						<span className="tabular-nums">{validHealthCheck ? "1 probe" : "no probe"}</span>
						<Button
							variant="ghost"
							size="sm"
							disabled={!template.healthCheck}
							onClick={() =>
								setHealthCheck({
									service: template.healthCheck?.service ?? "",
									command: template.healthCheck?.command ?? "",
								})
							}
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
								{canBePublic ? (
									<div className="flex flex-col gap-2">
										<label className="bp-label">visibility</label>
										<div className="flex items-center gap-px">
											{([
												["local", false, "Local to node — reachable only on the host"],
												["public", true, "Public — one ingress route per exposed port"],
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
										{isPublic && (
											<div className="flex flex-col gap-2 border border-dashed border-border bg-card/40 px-3 py-3">
												<div className="flex items-center justify-between">
													<span className="bp-label">ingress ports</span>
													<span className="text-[10px] tracking-[0.14em] uppercase tabular-nums text-muted-foreground">
														{validPorts.length} route{validPorts.length === 1 ? "" : "s"}
													</span>
												</div>
												<p className="text-[10px] leading-relaxed text-muted-foreground">
													Map a subdomain name to a <strong className="text-foreground">container port</strong> from your compose (not the host port). Each becomes <code className="text-foreground">{"["}name{"]"}-{slugifyPreview(containerName)}.buildpecker.com</code>.
												</p>
												{publicPorts.map((p, i) => (
													<div key={i} className="flex items-center gap-2">
														<Input
															value={p.name}
															onChange={(e) => updatePort(i, { name: e.target.value })}
															placeholder="dashboard"
															className="bg-card/60"
														/>
														<Input
															value={p.containerPort}
															onChange={(e) => updatePort(i, { containerPort: e.target.value.replace(/[^0-9]/g, "") })}
															inputMode="numeric"
															placeholder="6791"
															className="w-28 bg-card/60 tabular-nums"
														/>
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															onClick={() => removePort(i)}
															disabled={publicPorts.length === 1}
															aria-label="remove port"
														>
															<TrashIcon className="size-3.5" />
														</Button>
													</div>
												))}
												<Button type="button" variant="outline" size="sm" onClick={addPort} className="gap-1.5 self-start">
													<PlusIcon className="size-3.5" /> add port
												</Button>
											</div>
										)}
									</div>
								) : (
									<div className="border border-dashed border-border bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
										This template runs locally on the node and cannot be exposed publicly.
									</div>
								)}
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

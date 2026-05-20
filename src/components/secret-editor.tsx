"use client";

import * as React from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import {
	EyeIcon,
	EyeSlashIcon,
	PencilSimpleIcon,
	TrashIcon,
	PlusIcon,
	CheckIcon,
	XIcon,
	CircleNotchIcon,
	KeyIcon,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MASK = "••••••••••••••";
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

type RevealedMap = Record<string, string>;

export function SecretEditor({ projectId }: { projectId: Id<"projects"> }) {
	const data = useQuery(api.secrets.queries.getSecretKeysForProject, { projectId });
	const revealAction = useAction(api.environments.actions.revealSecret);
	const addAction = useAction(api.environments.actions.addSecret);
	const updateAction = useAction(api.environments.actions.updateSecret);
	const deleteAction = useAction(api.environments.actions.deleteSecret);

	const [revealed, setRevealed] = React.useState<RevealedMap>({});
	const [revealing, setRevealing] = React.useState<Set<string>>(new Set());
	const [editing, setEditing] = React.useState<string | null>(null);
	const [editKey, setEditKey] = React.useState("");
	const [editValue, setEditValue] = React.useState("");
	const [savingId, setSavingId] = React.useState<string | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	const [adding, setAdding] = React.useState(false);
	const [newKey, setNewKey] = React.useState("");
	const [newValue, setNewValue] = React.useState("");
	const [savingNew, setSavingNew] = React.useState(false);

	const loading = data === undefined;
	const secrets = data?.secrets ?? [];

	const toggleReveal = async (id: string) => {
		if (revealed[id] !== undefined) {
			setRevealed(prev => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			return;
		}
		setRevealing(prev => new Set(prev).add(id));
		try {
			const res = await revealAction({ id: id as Id<"secrets"> });
			setRevealed(prev => ({ ...prev, [id]: res.value }));
		} catch (err) {
			toast.error("failed to reveal", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setRevealing(prev => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const startEdit = (id: string, key: string) => {
		setEditing(id);
		setEditKey(key);
		setEditValue(revealed[id] ?? "");
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditKey("");
		setEditValue("");
	};

	const saveEdit = async (id: string) => {
		if (!KEY_RE.test(editKey.trim())) {
			toast.error("invalid key name");
			return;
		}
		setSavingId(id);
		try {
			await updateAction({ id: id as Id<"secrets">, key: editKey.trim(), value: editValue });
			setRevealed(prev => ({ ...prev, [id]: editValue }));
			toast.success("secret updated");
			cancelEdit();
		} catch (err) {
			toast.error("failed to update", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setSavingId(null);
		}
	};

	const handleDelete = async (id: string, key: string) => {
		if (!window.confirm(`Delete secret ${key}? This cannot be undone.`)) return;
		setDeletingId(id);
		try {
			await deleteAction({ id: id as Id<"secrets"> });
			setRevealed(prev => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			toast.success(`deleted ${key}`);
		} catch (err) {
			toast.error("failed to delete", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setDeletingId(null);
		}
	};

	const cancelAdd = () => {
		setAdding(false);
		setNewKey("");
		setNewValue("");
	};

	const saveAdd = async () => {
		if (!KEY_RE.test(newKey.trim())) {
			toast.error("invalid key name");
			return;
		}
		if (secrets.some(s => s.key === newKey.trim())) {
			toast.error(`${newKey.trim()} already exists`);
			return;
		}
		setSavingNew(true);
		try {
			await addAction({ projectId, key: newKey.trim(), value: newValue });
			toast.success(`added ${newKey.trim()}`);
			cancelAdd();
		} catch (err) {
			toast.error("failed to add", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setSavingNew(false);
		}
	};

	return (
		<div className="overflow-hidden border border-border bg-card/40">
			<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-px border-b border-border bg-border text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
				<div className="bg-card/60 px-3 py-2">name</div>
				<div className="bg-card/60 px-3 py-2">value</div>
				<div className="bg-card/60 px-3 py-2">actions</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center gap-2 px-3 py-8 text-muted-foreground">
					<CircleNotchIcon className="size-3.5 animate-spin" />
					<span className="text-xs">loading vault…</span>
				</div>
			) : secrets.length === 0 && !adding ? (
				<div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
					<KeyIcon className="size-5 text-muted-foreground/60" />
					<p className="text-xs text-muted-foreground">no secrets yet</p>
					<Button size="sm" onClick={() => setAdding(true)}>
						<PlusIcon className="size-3.5" /> add secret
					</Button>
				</div>
			) : (
				<div className="divide-y divide-border">
					{secrets.map(({ id, key }) => {
						const isEditing = editing === id;
						const isRevealing = revealing.has(id);
						const value = revealed[id];
						const revealedOpen = value !== undefined;

						if (isEditing) {
							return (
								<div key={id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 px-3 py-2">
									<Input
										value={editKey}
										onChange={e => setEditKey(e.target.value)}
										className="font-mono"
										autoFocus
										disabled={savingId === id}
									/>
									<Input
										value={editValue}
										onChange={e => setEditValue(e.target.value)}
										placeholder="value"
										className="font-mono"
										disabled={savingId === id}
									/>
									<div className="flex items-center gap-1">
										<Button
											size="icon-sm"
											variant="outline"
											onClick={() => saveEdit(id)}
											disabled={savingId === id || !editKey.trim() || editValue === ""}
											aria-label="save"
										>
											{savingId === id
												? <CircleNotchIcon className="size-3.5 animate-spin" />
												: <CheckIcon className="size-3.5" />}
										</Button>
										<Button
											size="icon-sm"
											variant="ghost"
											onClick={cancelEdit}
											disabled={savingId === id}
											aria-label="cancel"
										>
											<XIcon className="size-3.5" />
										</Button>
									</div>
								</div>
							);
						}

						return (
							<div
								key={id}
								className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-3 px-3 py-2.5 hover:bg-muted/20"
							>
								<div className="truncate font-mono text-xs font-medium text-foreground">{key}</div>
								<div className="flex items-center gap-2 min-w-0">
									<button
										type="button"
										onClick={() => toggleReveal(id)}
										disabled={isRevealing}
										aria-label={revealedOpen ? "hide value" : "show value"}
										className="inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
									>
										{isRevealing
											? <CircleNotchIcon className="size-3.5 animate-spin" />
											: revealedOpen
												? <EyeSlashIcon className="size-3.5" />
												: <EyeIcon className="size-3.5" />}
									</button>
									<span
										className={cn(
											"truncate font-mono text-xs",
											revealedOpen ? "text-foreground" : "text-muted-foreground tracking-widest",
										)}
									>
										{revealedOpen ? value : MASK}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Button
										size="icon-sm"
										variant="ghost"
										onClick={() => startEdit(id, key)}
										aria-label="edit"
									>
										<PencilSimpleIcon className="size-3.5" />
									</Button>
									<Button
										size="icon-sm"
										variant="ghost"
										onClick={() => handleDelete(id, key)}
										disabled={deletingId === id}
										aria-label="delete"
										className="text-destructive hover:text-destructive"
									>
										{deletingId === id
											? <CircleNotchIcon className="size-3.5 animate-spin" />
											: <TrashIcon className="size-3.5" />}
									</Button>
								</div>
							</div>
						);
					})}

					{adding ? (
						<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 px-3 py-2 bg-muted/20">
							<Input
								value={newKey}
								onChange={e => setNewKey(e.target.value.toUpperCase())}
								placeholder="MY_SECRET_KEY"
								className="font-mono"
								autoFocus
								disabled={savingNew}
							/>
							<Input
								value={newValue}
								onChange={e => setNewValue(e.target.value)}
								placeholder="value"
								className="font-mono"
								disabled={savingNew}
							/>
							<div className="flex items-center gap-1">
								<Button
									size="icon-sm"
									variant="outline"
									onClick={saveAdd}
									disabled={savingNew || !newKey.trim() || newValue === ""}
									aria-label="add"
								>
									{savingNew
										? <CircleNotchIcon className="size-3.5 animate-spin" />
										: <CheckIcon className="size-3.5" />}
								</Button>
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={cancelAdd}
									disabled={savingNew}
									aria-label="cancel"
								>
									<XIcon className="size-3.5" />
								</Button>
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setAdding(true)}
							className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] tracking-[0.06em] uppercase text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
						>
							<PlusIcon className="size-3.5" /> add secret
						</button>
					)}
				</div>
			)}
		</div>
	);
}

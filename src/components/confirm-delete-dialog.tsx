"use client";

import * as React from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";

interface ConfirmDeleteDialogProps {
	resourceLabel: string;
	resourceName: string;
	description?: React.ReactNode;
	onConfirm: () => Promise<unknown>;
	onSuccess?: () => void;
	triggerLabel?: string;
}

export function ConfirmDeleteDialog({
	resourceLabel,
	resourceName,
	description,
	onConfirm,
	onSuccess,
	triggerLabel,
}: ConfirmDeleteDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [confirmText, setConfirmText] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);

	const matches = confirmText.trim() === resourceName;

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			setConfirmText("");
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!matches || submitting) return;
		setSubmitting(true);
		try {
			await onConfirm();
			toast.success(`${resourceLabel} ${resourceName} deleted`);
			handleOpenChange(false);
			onSuccess?.();
		} catch (err) {
			toast.error(`failed to delete ${resourceLabel}`, {
				description: err instanceof Error ? err.message : String(err),
			});
			setSubmitting(false);
		}
	};

	return (
		<>
			<Button
				variant="destructive"
				size="sm"
				onClick={() => handleOpenChange(true)}
			>
				<TrashIcon className="size-3.5" />
				{triggerLabel ?? `delete ${resourceLabel}`}
			</Button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="border border-destructive/40">
					<DialogHeader>
						<DialogTitle>
							Delete {resourceLabel} <span className="font-mono">{resourceName}</span>?
						</DialogTitle>
						<DialogDescription>
							{description ?? (
								<>This action cannot be undone.</>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<span className="bp-label">
							type <span className="font-mono text-foreground">{resourceName}</span> to confirm
						</span>
						<Input
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder={resourceName}
							autoComplete="off"
							autoFocus
							className="font-mono"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleOpenChange(false)}
							disabled={submitting}
						>
							cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDelete}
							disabled={!matches || submitting}
						>
							{submitting ? (
								<>
									<CircleNotchIcon className="size-3.5 animate-spin" /> deleting
								</>
							) : (
								<>
									<TrashIcon className="size-3.5" /> delete forever
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

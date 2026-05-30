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
import { CircleNotchIcon, RecycleIcon } from "@phosphor-icons/react";

interface ConfirmRedeployDialogProps {
	resourceName: string;
	description?: React.ReactNode;
	onConfirm: () => Promise<unknown>;
	onSuccess?: () => void;
	triggerLabel?: string;
	disabled?: boolean;
}

export function ConfirmRedeployDialog({
	resourceName,
	description,
	onConfirm,
	onSuccess,
	triggerLabel,
	disabled,
}: ConfirmRedeployDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);

	const handleOpenChange = (next: boolean) => {
		if (submitting) return;
		setOpen(next);
	};

	const handleConfirm = async () => {
		if (submitting) return;
		setSubmitting(true);
		try {
			await onConfirm();
			toast.success(`deployment ${resourceName} re-queued`);
			setOpen(false);
			onSuccess?.();
		} catch (err) {
			toast.error("failed to re-deploy", {
				description: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
				disabled={disabled}
			>
				<RecycleIcon className="size-3.5" />
				{triggerLabel ?? "re-deploy"}
			</Button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="border border-primary/40">
					<DialogHeader>
						<DialogTitle>
							Re-deploy <span className="font-mono">{resourceName}</span>?
						</DialogTitle>
						<DialogDescription>
							{description ?? (
								<>Queues a fresh build using the same project, branch, and target node.</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setOpen(false)}
							disabled={submitting}
						>
							cancel
						</Button>
						<Button
							size="sm"
							onClick={handleConfirm}
							disabled={submitting}
						>
							{submitting ? (
								<>
									<CircleNotchIcon className="size-3.5 animate-spin" /> queuing
								</>
							) : (
								<>
									<RecycleIcon className="size-3.5" /> re-deploy
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

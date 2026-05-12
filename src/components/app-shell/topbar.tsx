"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRightIcon, HouseIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Crumb = { href?: string; label: string };

function buildCrumbs(pathname: string): Crumb[] {
	const parts = pathname.split("/").filter(Boolean);
	if (parts.length === 0) return [];
	const crumbs: Crumb[] = [];
	let acc = "";
	for (let i = 0; i < parts.length; i++) {
		acc += "/" + parts[i];
		const isLast = i === parts.length - 1;
		const raw = parts[i];
		const label = raw.startsWith("[") ? raw : raw.replace(/-/g, " ");
		crumbs.push({ href: isLast ? undefined : acc, label });
	}
	return crumbs;
}

export function Topbar({ action }: { action?: React.ReactNode }) {
	const pathname = usePathname();
	const crumbs = buildCrumbs(pathname);
	return (
		<div className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<nav className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase" aria-label="Breadcrumb">
				<Link href="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
					<HouseIcon className="size-3.5" />
				</Link>
				{crumbs.map((c, i) => (
					<React.Fragment key={i}>
						<CaretRightIcon className="size-3 text-border" />
						{c.href ? (
							<Link href={c.href} className="text-muted-foreground hover:text-foreground">
								{c.label}
							</Link>
						) : (
							<span className={cn("text-foreground")}>{c.label}</span>
						)}
					</React.Fragment>
				))}
			</nav>
			{action && <div className="flex items-center gap-2">{action}</div>}
		</div>
	);
}

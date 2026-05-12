"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	GaugeIcon,
	FolderIcon,
	HardDrivesIcon,
	RocketLaunchIcon,
	GearSixIcon,
	LightningIcon,
} from "@phosphor-icons/react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { pageRevisionStamp } from "@/lib/format";

type NavItem = {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	tag?: string;
};

const NAV: NavItem[] = [
	{ href: "/dashboard", label: "Dashboard", icon: GaugeIcon, tag: "00" },
	{ href: "/projects", label: "Projects", icon: FolderIcon, tag: "01" },
	{ href: "/nodes", label: "Nodes", icon: HardDrivesIcon, tag: "02" },
	{ href: "/deployments", label: "Deployments", icon: RocketLaunchIcon, tag: "03" },
	{ href: "/settings", label: "Settings", icon: GearSixIcon, tag: "04" },
];

export function AppSidebar() {
	const pathname = usePathname();
	const stamp = pageRevisionStamp("forge");

	return (
		<aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
			<div className="flex items-center gap-2 border-b border-border px-5 py-4">
				<div className="flex size-7 items-center justify-center border border-border bg-primary text-primary-foreground">
					<LightningIcon weight="fill" className="size-4" />
				</div>
				<div className="flex flex-col leading-none">
					<span className="text-sm font-medium tracking-[0.18em] uppercase">forge</span>
					<span className="bp-caption text-[9px]">{stamp.rev} · {stamp.date}</span>
				</div>
			</div>

			<nav className="flex-1 overflow-y-auto px-3 py-4">
				<div className="bp-label px-3 pb-2">Console</div>
				<ul className="flex flex-col gap-0.5">
					{NAV.map((item) => {
						const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									className={cn(
										"group relative flex items-center gap-3 border-l-2 px-3 py-2 text-xs tracking-[0.04em] transition-colors",
										active
											? "border-l-primary bg-sidebar-accent text-foreground"
											: "border-l-transparent text-muted-foreground hover:border-l-border hover:bg-sidebar-accent/40 hover:text-foreground",
									)}
								>
									<item.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
									<span className="flex-1">{item.label}</span>
									{item.tag && (
										<span className="bp-caption text-[9px] tabular-nums">{item.tag}</span>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="border-t border-border px-3 py-4">
				<div className="bp-label px-1 pb-2">View</div>
				<ThemeToggle />
			</div>

			<div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
				<UserButton
					appearance={{
						elements: {
							avatarBox: "size-7 rounded-none border border-border",
						},
					}}
				/>
				<div className="flex flex-col items-end text-right">
					<span className="bp-label text-[9px]">node operator</span>
					<span className="bp-caption text-[9px]">v0.1.0</span>
				</div>
			</div>
		</aside>
	);
}

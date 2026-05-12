"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { UserProfile } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Topbar } from "@/components/app-shell/topbar";
import { Panel, PanelBody } from "@/components/blueprint/panel";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { CopyToken } from "@/components/copy-token";

export default function SettingsPage() {
	const user = useQuery(api.users.queries.current);

	return (
		<div>
			<Topbar />
			<div className="mx-auto w-full max-w-6xl px-6 py-8">
				<header className="mb-6 grid grid-cols-1 gap-3">
					<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
						<span className="bp-label">settings · account</span>
						<div className="h-px bg-border" />
						<span className="bp-caption tabular-nums">sheet 04/04</span>
					</div>
					<h1 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Settings</h1>
					<p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
						Identity, theme, and identifiers. Account credentials are managed by Clerk.
					</p>
				</header>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<Panel tag="A" label="Identity" className="min-w-0 overflow-hidden md:col-span-2">
						<PanelBody className="min-w-0 overflow-x-auto p-0 flex justify-center">
							{user ? (
								<UserProfile
									routing="hash"
									appearance={{
										elements: {
											rootBox: "w-full",
											cardBox: "shadow-none border-0 rounded-none bg-transparent",
											card: "shadow-none rounded-none bg-transparent",
											navbar: "border-r border-border bg-card/40 rounded-none",
											navbarButton: "rounded-none text-xs tracking-[0.04em]",
											navbarButtonActive: "bg-primary text-primary-foreground",
											formButtonPrimary: "rounded-none bg-primary text-primary-foreground",
											formFieldInput: "rounded-none border-border bg-card",
											headerTitle: "font-mono tracking-[-0.01em]",
											headerSubtitle: "text-muted-foreground",
											profileSection: "border-b border-border",
											profileSectionTitleText: "text-xs tracking-[0.14em] uppercase",
										},
										variables: {
											colorPrimary: "var(--primary)",
											colorBackground: "var(--background)",
											colorText: "var(--foreground)",
											colorTextSecondary: "var(--muted-foreground)",
											colorInputBackground: "var(--card)",
											colorInputText: "var(--foreground)",
											colorNeutral: "var(--muted-foreground)",
											fontFamily: "var(--font-mono)",
											borderRadius: "0",
										},
									}}
								/>
							) : (
								<span className="block px-4 py-4 text-xs text-muted-foreground">loading account…</span>
							)}
						</PanelBody>
					</Panel>

					<Panel tag="B" label="Appearance" className="min-w-0 overflow-hidden">
						<PanelBody className="grid gap-3">
							<span className="bp-label">theme</span>
							<ThemeToggle />
							<p className="text-[11px] leading-relaxed text-muted-foreground">
								Preference is stored locally. Dark is the default.
							</p>
						</PanelBody>
					</Panel>

					{user && (
						<Panel tag="C" label="Identifiers" className="min-w-0 overflow-hidden">
							<PanelBody className="grid min-w-0 gap-3">
								<CopyToken label="user id" value={user._id} />
								<CopyToken label="auth token" value={user.authToken} masked />
							</PanelBody>
						</Panel>
					)}
				</div>
			</div>
		</div>
	);
}

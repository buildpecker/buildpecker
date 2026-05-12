"use client";

import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import { LightningIcon, CpuIcon, MemoryIcon, HardDriveIcon } from "@phosphor-icons/react";
import { pageRevisionStamp } from "@/lib/format";

export default function SignInPage() {
	const stamp = pageRevisionStamp("forge");

	return (
		<div className="dark relative min-h-screen w-full overflow-hidden bg-background text-foreground">
			<div className="pointer-events-none absolute inset-0 bp-grid opacity-[0.12]" aria-hidden />
			<div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
				{/* LEFT — blueprint hero */}
				<aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex">
					{/* corner brackets on whole panel */}
					<div className="pointer-events-none absolute inset-6 border border-dashed border-border/60" aria-hidden />

					<header className="relative flex items-center gap-3">
						<div className="flex size-9 items-center justify-center border border-border bg-primary text-primary-foreground">
							<LightningIcon weight="fill" className="size-5" />
						</div>
						<div className="flex flex-col leading-none">
							<span className="text-base font-medium tracking-[0.18em] uppercase">forge</span>
							<span className="bp-caption text-[10px]">orchestrator · v0.1.0</span>
						</div>
					</header>

					<div className="relative flex flex-col gap-8">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<span className="bp-label">deploy assembly</span>
								<div className="h-px flex-1 bg-border" />
								<span className="bp-caption tabular-nums">drw. 001</span>
							</div>
							<h1 className="text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
								Deploy to the<br />
								<span className="text-primary">servers you own.</span>
							</h1>
							<p className="max-w-md text-xs leading-relaxed text-muted-foreground">
								Forge sketches a single control surface over your VPS fleet — projects, nodes, encrypted secrets,
								queued builds. No third-party host. No black box.
							</p>
						</div>

						<div className="bp-corners relative border border-border bg-card/40 p-5">
							<span className="bp-corner-bl" />
							<span className="bp-corner-br" />
							<div className="flex items-center justify-between border-b border-border pb-2">
								<span className="bp-label">node-04 · spec sheet</span>
								<span className="bp-caption text-[10px] tabular-nums">rev. 04</span>
							</div>
							<div className="mt-4 grid grid-cols-3 gap-4">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1.5 bp-caption">
										<CpuIcon className="size-3" /> cpu
									</div>
									<span className="font-mono text-2xl tabular-nums text-foreground">16</span>
									<span className="bp-caption text-[10px]">cores</span>
								</div>
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1.5 bp-caption">
										<MemoryIcon className="size-3" /> mem
									</div>
									<span className="font-mono text-2xl tabular-nums text-foreground">64</span>
									<span className="bp-caption text-[10px]">gb</span>
								</div>
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-1.5 bp-caption">
										<HardDriveIcon className="size-3" /> disk
									</div>
									<span className="font-mono text-2xl tabular-nums text-foreground">1.0</span>
									<span className="bp-caption text-[10px]">tb</span>
								</div>
							</div>
							<div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
								<span>status · idle</span>
								<span className="tabular-nums">queue · 0</span>
							</div>
						</div>

						<div className="flex items-center gap-6 text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<span className="size-1.5 bg-[var(--status-queued)]" /> queued
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-1.5 bg-[var(--status-processing)]" /> processing
							</div>
							<div className="flex items-center gap-1.5">
								<span className="size-1.5 bg-[var(--status-completed)]" /> completed
							</div>
						</div>
					</div>

					<footer className="relative flex items-center justify-between border-t border-border pt-4 text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
						<span>{stamp.scale}</span>
						<span>{stamp.rev}</span>
						<span className="tabular-nums">{stamp.date}</span>
					</footer>
				</aside>

				{/* RIGHT — clerk sign-in */}
				<section className="relative flex flex-col items-center justify-center p-8 lg:p-12">
					<div className="flex w-full max-w-sm flex-col gap-6">
						<div className="flex flex-col gap-2 lg:hidden">
							<div className="flex items-center gap-2">
								<div className="flex size-8 items-center justify-center border border-border bg-primary text-primary-foreground">
									<LightningIcon weight="fill" className="size-4" />
								</div>
								<span className="text-sm font-medium tracking-[0.18em] uppercase">forge</span>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<span className="bp-label">access · sign in</span>
							<h2 className="text-2xl font-medium tracking-[-0.01em] text-foreground">Authenticate</h2>
							<p className="text-[11px] leading-relaxed text-muted-foreground">
								Sign in to your forge workspace. New here? Use the link below the form to create an account.
							</p>
						</div>

						<SignIn
							routing="hash"
							fallbackRedirectUrl="/dashboard"
							signUpUrl="/sign-in#/sign-up"
							appearance={{
								elements: {
									rootBox: "w-full",
									cardBox: "w-full shadow-none rounded-none border border-border bg-card/40 backdrop-blur",
									card: "shadow-none rounded-none bg-transparent p-6",
									header: "hidden",
									headerTitle: "hidden",
									headerSubtitle: "hidden",
									dividerRow: "my-3",
									dividerLine: "bg-border",
									dividerText: "text-[10px] tracking-[0.16em] uppercase text-muted-foreground bg-card/40 px-2",
									socialButtonsBlockButton:
										"rounded-none border border-border bg-background hover:bg-muted text-foreground text-xs tracking-[0.04em]",
									socialButtonsBlockButtonText: "text-xs tracking-[0.04em]",
									formFieldLabel: "text-[10px] tracking-[0.14em] uppercase text-muted-foreground",
									formFieldInput:
										"rounded-none border-border bg-background text-xs h-10 focus:border-primary focus:ring-1 focus:ring-primary",
									formButtonPrimary:
										"rounded-none bg-primary text-primary-foreground text-xs tracking-[0.04em] hover:bg-primary/90 active:translate-y-px",
									footerActionText: "text-[10px] tracking-[0.06em] text-muted-foreground",
									footerActionLink: "text-[10px] tracking-[0.06em] text-primary hover:underline",
									identityPreview: "rounded-none border-border bg-background",
									alternativeMethods: "gap-1",
									alternativeMethodsBlockButton:
										"rounded-none border border-border bg-background hover:bg-muted text-foreground text-xs tracking-[0.04em]",
									otpCodeFieldInput: "rounded-none border-border bg-background",
									formFieldAction: "text-[10px] tracking-[0.06em] text-primary",
									footer: "bg-transparent",
								},
								variables: {
									colorPrimary: "var(--primary)",
									colorBackground: "transparent",
									colorText: "var(--foreground)",
									colorTextSecondary: "var(--muted-foreground)",
									colorInputBackground: "var(--background)",
									colorInputText: "var(--foreground)",
									colorNeutral: "var(--muted-foreground)",
									fontFamily: "var(--font-mono)",
									borderRadius: "0",
									spacingUnit: "0.25rem",
								},
							}}
						/>

						<div className="flex items-center justify-between bp-caption tabular-nums">
							<span>secured by clerk</span>
							<span>tls · enforced</span>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

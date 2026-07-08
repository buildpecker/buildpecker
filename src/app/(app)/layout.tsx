import * as React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-shell/sidebar";
import { PageStamp } from "@/components/app-shell/page-stamp";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return (
		<div className="relative flex h-screen overflow-hidden">
			<AppSidebar />
			<div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bp-grid opacity-[0.12]" aria-hidden />
				<main className="relative z-10 min-w-0 flex-1 overflow-y-auto">{children}</main>
				<PageStamp slug="buildpecker" />
			</div>
		</div>
	);
}

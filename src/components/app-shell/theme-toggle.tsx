"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	return (
		<div
			role="group"
			aria-label="Theme"
			className={cn(
				"inline-flex w-full border border-border bg-card/60 p-0.5 text-[10px] tracking-[0.16em] uppercase",
				className,
			)}
		>
			<button
				type="button"
				onClick={() => setTheme("dark")}
				aria-pressed={theme === "dark"}
				className={cn(
					"flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 transition-colors",
					theme === "dark"
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				<MoonIcon className="size-3" /> dark
			</button>
			<button
				type="button"
				onClick={() => setTheme("light")}
				aria-pressed={theme === "light"}
				className={cn(
					"flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 transition-colors",
					theme === "light"
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				<SunIcon className="size-3" /> light
			</button>
		</div>
	);
}

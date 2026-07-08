"use client";

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
	if (typeof window === "undefined") return "dark";
	const stored = window.localStorage.getItem("buildpecker-theme");
	return stored === "light" || stored === "dark" ? stored : "dark";
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
	listeners.add(onChange);
	window.addEventListener("storage", onChange);
	return () => {
		listeners.delete(onChange);
		window.removeEventListener("storage", onChange);
	};
}

function writeStoredTheme(next: Theme) {
	if (typeof window !== "undefined") {
		window.localStorage.setItem("buildpecker-theme", next);
	}
	listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// The server snapshot ("dark") matches the SSR-ed HTML; the client snapshot
	// reads from storage, so React reconciles to the stored theme after hydration.
	const theme = useSyncExternalStore(subscribe, readStoredTheme, () => "dark" as Theme);

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const setTheme = useCallback((next: Theme) => {
		writeStoredTheme(next);
	}, []);

	const toggle = useCallback(() => {
		writeStoredTheme(readStoredTheme() === "dark" ? "light" : "dark");
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggle }}>
			{children}
		</ThemeContext.Provider>
	);
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	if (theme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
	root.style.colorScheme = theme;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
	return ctx;
}

export const themeInitScript = `
(function(){try{var t=localStorage.getItem('buildpecker-theme');if(t!=='light'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){document.documentElement.classList.add('dark');}})();
`.trim();

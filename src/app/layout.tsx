import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/providers/ConvexClientProvider";
import { ThemeProvider, themeInitScript } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Forge — deploy to your own nodes",
	description: "Vercel-class orchestration for the servers you actually own.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable)}
		>
			<body className="min-h-full flex flex-col bg-background text-foreground">
				<Script id="forge-theme-init" strategy="beforeInteractive">
					{themeInitScript}
				</Script>
				<ClerkProvider>
					<ConvexClientProvider>
						<ThemeProvider>
							<TooltipProvider delay={120}>
								{children}
								<Toaster position="bottom-right" />
							</TooltipProvider>
						</ThemeProvider>
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}

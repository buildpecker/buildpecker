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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const title = "Buildpecker — deploy to your own nodes";
const description = "Vercel-class orchestration for the servers you actually own.";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title,
	description,
	openGraph: {
		title,
		description,
		siteName: "Buildpecker",
		type: "website",
		url: siteUrl,
		images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: ["/og.png"],
	},
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
				<Script id="buildpecker-theme-init" strategy="beforeInteractive">
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

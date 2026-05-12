import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (isPublicRoute(req)) return;
	const { userId } = await auth();
	if (!userId) {
		const url = new URL("/sign-in", req.url);
		return NextResponse.redirect(url);
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};

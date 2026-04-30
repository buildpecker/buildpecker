import { AuthConfig } from "convex/server";

export default {
	providers: [
		{
			domain: "https://enabling-falcon-70.clerk.accounts.dev",
			applicationID: "convex",
		},
	]
} satisfies AuthConfig;

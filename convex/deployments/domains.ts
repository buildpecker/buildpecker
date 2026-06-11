import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action, httpAction, internalAction, internalMutation, internalQuery } from "../_generated/server";

const CADDY_SYNC_URL = "https://caddy-dns.parthajeet.xyz/custom-domain";
const CADDY_SYNC_SECRET = process.env.CADDY_SYNC_SECRET ?? "";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function normalizeDomain(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/\/.*$/, "")
		.replace(/\.$/, "");
}

export const getCustomDomainMappings = internalQuery({
	args: {},
	handler: async (ctx) => {
		const all = await ctx.db.query("deployments").collect();
		return all
			.filter(d => !!d.customDomainUrl && d.status === "completed")
			.map(d => ({ customDomain: d.customDomainUrl as string, generatedDomain: d.publicUrl }));
	},
});

export const isCustomDomainActive = internalQuery({
	args: { domain: v.string() },
	handler: async (ctx, args) => {
		const all = await ctx.db.query("deployments").collect();
		return all.some(d => d.customDomainUrl === args.domain && d.status === "completed");
	},
});

export const authorizeDomainAction = httpAction(async (ctx, req) => {
	const url = new URL(req.url);
	const domain = (url.searchParams.get("domain") ?? "").trim().toLowerCase();
	if (!domain) return new Response(null, { status: 400 });
	const ok = await ctx.runQuery(internal.deployments.domains.isCustomDomainActive, { domain });
	return new Response(null, { status: ok ? 200 : 403 });
});

export const isCustomDomainTaken = internalQuery({
	args: { domain: v.string(), excludeId: v.id("deployments") },
	handler: async (ctx, args) => {
		const all = await ctx.db.query("deployments").collect();
		return all.some(d => d.customDomainUrl === args.domain && d._id !== args.excludeId);
	},
});

export const setCustomDomainUrl = internalMutation({
	args: { id: v.id("deployments"), customDomainUrl: v.optional(v.string()) },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { customDomainUrl: args.customDomainUrl });
	},
});

export const syncCustomDomains = internalAction({
	args: {},
	handler: async (ctx) => {
		const domainMappings = await ctx.runQuery(internal.deployments.domains.getCustomDomainMappings, {});
		const res = await fetch(CADDY_SYNC_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${CADDY_SYNC_SECRET}`,
			},
			body: JSON.stringify({ domainMappings }),
		});
		if (!res.ok) {
			throw new Error(`Caddy sync failed: ${res.status} ${await res.text()}`);
		}
	},
});

export const setCustomDomain = action({
	args: { id: v.id("deployments"), customDomain: v.string() },
	handler: async (ctx, args): Promise<void> => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id: args.id });
		if (!dep) throw new Error("Deployment not found");

		const ownerId = dep.project?.ownerId ?? dep.infra?.ownerId;
		if (!ownerId || ownerId !== user._id) throw new Error("Forbidden");

		const normalized = normalizeDomain(args.customDomain);

		if (normalized) {
			if (!DOMAIN_RE.test(normalized)) throw new Error("Invalid domain");
			const taken = await ctx.runQuery(internal.deployments.domains.isCustomDomainTaken, {
				domain: normalized,
				excludeId: args.id,
			});
			if (taken) throw new Error("Domain already in use by another deployment");
		}

		await ctx.runMutation(internal.deployments.domains.setCustomDomainUrl, {
			id: args.id,
			customDomainUrl: normalized || undefined,
		});

		await ctx.runAction(internal.deployments.domains.syncCustomDomains, {});
	},
});

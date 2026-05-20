import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

import { deleteNode, setHeartbeatAction } from "../convex/nodes/actions"
import { finalizeDeleteAction, getPendingDeletesAction, getQueuedDeploymentsAction, setDeploymentStatusAction } from "./deployments/actions";
import { setProjectFrameworkAction } from "./projects/actions";
import { getEnvironmentSecretsAction } from "./environments/actions";

const http = httpRouter();

http.route({
	path: "/clerk-users-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const event = await validateRequest(request);
		if (!event) {
			return new Response("Error occured", { status: 400 });
		}
		switch (event.type) {
			case "user.created": // intentional fallthrough
			case "user.updated":
				await ctx.runMutation(internal.users.mutations.upsertFromClerk, {
					data: event.data,
				});
				break;

			case "user.deleted": {
				const clerkUserId = event.data.id!;
				await ctx.runMutation(internal.users.mutations.deleteFromClerk, { clerkUserId });
				break;
			}
			default:
				console.log("Ignored Clerk webhook event", event.type);
		}

		return new Response(null, { status: 200 });
	}),
});

http.route({
	path: "/nodes/delete-node",
	method: "POST",
	handler: deleteNode
})

http.route({
	path: "/deployments/queued",
	method: "POST",
	handler: getQueuedDeploymentsAction
})

http.route({
	path: "/deployments/status",
	method: "PATCH",
	handler: setDeploymentStatusAction
})

http.route({
	path: "/deployments/pending-deletes",
	method: "POST",
	handler: getPendingDeletesAction
})

http.route({
	path: "/deployments/finalize-delete",
	method: "POST",
	handler: finalizeDeleteAction
})

http.route({
	path: "/projects/framework",
	method: "PATCH",
	handler: setProjectFrameworkAction
})

http.route({
	path: "/environments/secrets",
	method: "POST",
	handler: getEnvironmentSecretsAction
})

http.route({
	path: "/nodes/heartbeat",
	method: "POST",
	handler: setHeartbeatAction
})

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
	const payloadString = await req.text();
	const svixHeaders = {
		"svix-id": req.headers.get("svix-id")!,
		"svix-timestamp": req.headers.get("svix-timestamp")!,
		"svix-signature": req.headers.get("svix-signature")!,
	};
	const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
	try {
		return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
	} catch (error) {
		console.error("Error verifying webhook event", error);
		return null;
	}
}

export default http;

import { v } from "convex/values";
import { action } from "../_generated/server";

type Point = { t: number; v: number };

async function rangeQuery(
	promUrl: string,
	query: string,
	start: number,
	end: number,
	step: number,
): Promise<Point[]> {
	const url = new URL(promUrl.replace(/\/$/, "") + "/api/v1/query_range");
	url.searchParams.set("query", query);
	url.searchParams.set("start", String(start));
	url.searchParams.set("end", String(end));
	url.searchParams.set("step", String(step));

	const res = await fetch(url.toString(), { method: "GET" });
	if (!res.ok) {
		throw new Error(`prometheus ${res.status}: ${await res.text()}`);
	}
	const json = (await res.json()) as {
		data: { result: Array<{ values: Array<[number, string]> }> };
	};
	const values = json.data.result[0]?.values ?? [];
	return values.map(([t, v]) => ({ t, v: Number(v) }));
}

export const getNodeMetrics = action({
	args: {
		nodeId: v.string(),
		rangeMinutes: v.optional(v.number()),
	},
	handler: async (_ctx, args) => {
		const promUrl = process.env.PROMETHEUS_URL;
		if (!promUrl) {
			throw new Error("PROMETHEUS_URL env var not set on Convex deployment");
		}

		// node_id values are Convex IDs (alphanumeric); strip anything that
		// could break out of the label-match string just in case.
		const safeId = args.nodeId.replace(/[^A-Za-z0-9_-]/g, "");
		const sel = `{node_id="${safeId}"}`;

		const range = args.rangeMinutes ?? 15;
		const end = Math.floor(Date.now() / 1000);
		const start = end - range * 60;
		// aim for ~60 points
		const step = Math.max(15, Math.floor((range * 60) / 60));

		const [cpu, memory, disk] = await Promise.all([
			rangeQuery(promUrl, `forge_node_cpu_percent${sel}`, start, end, step),
			rangeQuery(
				promUrl,
				`100 * forge_node_memory_used_bytes${sel} / forge_node_memory_total_bytes${sel}`,
				start,
				end,
				step,
			),
			rangeQuery(
				promUrl,
				`100 * forge_node_disk_used_bytes${sel} / forge_node_disk_total_bytes${sel}`,
				start,
				end,
				step,
			),
		]);

		return { cpu, memory, disk };
	},
});

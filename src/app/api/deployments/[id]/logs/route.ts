import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOKI_URL =
	process.env.LOKI_URL ?? "http://localhost:3100";

const POLL_INTERVAL_MS = 1_000;
const HEARTBEAT_MS = 5_000;
const REPLAY_WINDOW_HOURS = 24;
const FETCH_LIMIT = 1_000;

type LokiValue = [string, string] | [string, string, Record<string, string>];

interface LokiResponse {
	status: string;
	data: {
		resultType: string;
		result: Array<{
			stream: Record<string, string>;
			values: LokiValue[];
		}>;
	};
}

interface LogEntry {
	t: string;
	line: string;
}

function buildQuery(deploymentId: string): string {
	return `{service="deployment"} | deployment_id="${deploymentId}"`;
}

async function fetchRange(
	deploymentId: string,
	startNs: string,
	endNs: string,
	signal: AbortSignal,
): Promise<LogEntry[]> {
	const url = new URL(LOKI_URL.replace(/\/$/, "") + "/loki/api/v1/query_range");
	url.searchParams.set("query", buildQuery(deploymentId));
	url.searchParams.set("start", startNs);
	url.searchParams.set("end", endNs);
	url.searchParams.set("limit", String(FETCH_LIMIT));
	url.searchParams.set("direction", "forward");

	const res = await fetch(url.toString(), { signal });
	if (!res.ok) {
		throw new Error(`loki ${res.status}: ${await res.text().catch(() => "")}`);
	}
	const body = (await res.json()) as LokiResponse;

	const entries: LogEntry[] = [];
	for (const stream of body.data.result) {
		for (const v of stream.values) {
			entries.push({ t: v[0], line: v[1] });
		}
	}
	entries.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
	return entries;
}

const NS_PER_MS = BigInt(1_000_000);
const ONE = BigInt(1);

function nowNs(): string {
	return (BigInt(Date.now()) * NS_PER_MS).toString();
}

function bumpNs(ns: string): string {
	return (BigInt(ns) + ONE).toString();
}

function hoursAgoNs(hours: number): string {
	const ms = BigInt(Date.now() - hours * 3600 * 1000);
	return (ms * NS_PER_MS).toString();
}

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const safeId = id.replace(/[^A-Za-z0-9_-]/g, "");
	if (!safeId) {
		return new Response("invalid deployment id", { status: 400 });
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let closed = false;
			let cursor = hoursAgoNs(REPLAY_WINDOW_HOURS);
			let poll: ReturnType<typeof setInterval> | undefined;
			let heart: ReturnType<typeof setInterval> | undefined;

			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					// controller already closing
				}
			};

			const send = (event: string, data: unknown) => {
				write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
			};

			const teardown = () => {
				if (closed) return;
				closed = true;
				if (poll) clearInterval(poll);
				if (heart) clearInterval(heart);
				try {
					controller.close();
				} catch {
					// already closed
				}
			};

			req.signal.addEventListener("abort", teardown);

			// flush headers immediately + tell browser to retry every 1s on drop
			write(`retry: 1000\n: connected\n\n`);

			// 1) replay history
			try {
				const history = await fetchRange(safeId, cursor, nowNs(), req.signal);
				if (history.length > 0) {
					send("log", history);
					cursor = bumpNs(history[history.length - 1].t);
				}
				send("ready", { cursor });
			} catch (err) {
				if (!req.signal.aborted) {
					send("stream_error", {
						message: err instanceof Error ? err.message : "loki replay failed",
					});
				}
				teardown();
				return;
			}

			// 2) tail loop — does NOT teardown on transient failure, just notifies
			poll = setInterval(async () => {
				if (closed) return;
				try {
					const fresh = await fetchRange(safeId, cursor, nowNs(), req.signal);
					if (fresh.length > 0) {
						send("log", fresh);
						cursor = bumpNs(fresh[fresh.length - 1].t);
					}
				} catch (err) {
					if (req.signal.aborted || closed) return;
					send("stream_error", {
						message: err instanceof Error ? err.message : "loki poll failed",
					});
				}
			}, POLL_INTERVAL_MS);

			// 3) heartbeat — SSE comment, keeps proxies/dev servers from idling out
			heart = setInterval(() => write(`: keepalive\n\n`), HEARTBEAT_MS);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			"X-Accel-Buffering": "no",
		},
	});
}

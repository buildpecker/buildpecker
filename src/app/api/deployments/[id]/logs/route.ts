import type { NextRequest } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOKI_URL =
	process.env.LOKI_URL ?? "http://localhost:3100";

const HEARTBEAT_MS = 5_000;
const REPLAY_WINDOW_HOURS = 24 * 30;
const FETCH_LIMIT = 1_000;
const TAIL_RECONNECT_MS = 1_000;

type LokiValue = [string, string] | [string, string, Record<string, string>];

interface LokiQueryRangeResponse {
	status: string;
	data: {
		resultType: string;
		result: Array<{
			stream: Record<string, string>;
			values: LokiValue[];
		}>;
	};
}

interface LokiTailMessage {
	streams?: Array<{
		stream: Record<string, string>;
		values: LokiValue[];
	}>;
	dropped_entries?: Array<{ labels: Record<string, string>; timestamp: string }>;
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
	const body = (await res.json()) as LokiQueryRangeResponse;

	const entries: LogEntry[] = [];
	for (const stream of body.data.result) {
		for (const v of stream.values) {
			entries.push({ t: v[0], line: v[1] });
		}
	}
	entries.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
	return entries;
}

function tailUrl(deploymentId: string, startNs: string): string {
	const base = LOKI_URL.replace(/\/$/, "").replace(/^http/, "ws");
	const url = new URL(base + "/loki/api/v1/tail");
	url.searchParams.set("query", buildQuery(deploymentId));
	url.searchParams.set("start", startNs);
	url.searchParams.set("limit", String(FETCH_LIMIT));
	return url.toString();
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
			// eslint-disable-next-line prefer-const
			let heart: ReturnType<typeof setInterval> | undefined;
			let ws: WebSocket | undefined;
			let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

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
				if (heart) clearInterval(heart);
				if (reconnectTimer) clearTimeout(reconnectTimer);
				if (ws) {
					try {
						ws.removeAllListeners();
						ws.close();
					} catch {
						// noop
					}
				}
				try {
					controller.close();
				} catch {
					// already closed
				}
			};

			req.signal.addEventListener("abort", teardown);

			// flush headers + browser reconnect hint
			write(`retry: 1000\n: connected\n\n`);

			const openTail = (startNs: string) => {
				if (closed) return;
				const sock = new WebSocket(tailUrl(safeId, startNs));
				ws = sock;

				sock.on("message", raw => {
					if (closed) return;
					try {
						const msg = JSON.parse(raw.toString()) as LokiTailMessage;
						const entries: LogEntry[] = [];
						for (const s of msg.streams ?? []) {
							for (const v of s.values) {
								entries.push({ t: v[0], line: v[1] });
							}
						}
						if (entries.length === 0) return;
						entries.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
						send("log", entries);
						cursor = bumpNs(entries[entries.length - 1].t);
					} catch (err) {
						send("stream_error", {
							message: err instanceof Error ? err.message : "tail parse failed",
						});
					}
				});

				sock.on("error", err => {
					if (closed) return;
					send("stream_error", {
						message: err instanceof Error ? err.message : "tail socket error",
					});
				});

				sock.on("close", () => {
					if (closed) return;
					// reconnect from last seen cursor
					reconnectTimer = setTimeout(() => openTail(cursor), TAIL_RECONNECT_MS);
				});
			};

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

			// 2) live tail via Loki WebSocket
			openTail(cursor);

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

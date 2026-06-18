"use client";

import * as React from "react";

interface LogEntry {
	t: string;
	line: string;
}

type State = "connecting" | "replaying" | "live" | "reconnecting" | "error" | "closed";

const MAX_LINES = 5_000;

export function DeploymentLogStream({ deploymentId }: { deploymentId: string }) {
	const [entries, setEntries] = React.useState<LogEntry[]>([]);
	const [state, setState] = React.useState<State>("connecting");
	const [errMsg, setErrMsg] = React.useState<string | null>(null);
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const stickToBottom = React.useRef(true);

	const [trackedId, setTrackedId] = React.useState(deploymentId);
	if (trackedId !== deploymentId) {
		setTrackedId(deploymentId);
		setState("connecting");
	}

	React.useEffect(() => {
		const es = new EventSource(`/api/deployments/${deploymentId}/logs`);

		es.addEventListener("open", () => {
			setState(prev => (prev === "live" ? "live" : "replaying"));
		});

		es.addEventListener("log", e => {
			const data = JSON.parse((e as MessageEvent).data) as LogEntry[];
			setEntries(prev => {
				const merged = prev.concat(data);
				return merged.length > MAX_LINES
					? merged.slice(merged.length - MAX_LINES)
					: merged;
			});
		});

		es.addEventListener("ready", () => {
			setState("live");
			setErrMsg(null);
		});

		es.addEventListener("stream_error", e => {
			const md = e as MessageEvent;
			try {
				const payload = JSON.parse(md.data) as { message?: string };
				setErrMsg(payload.message ?? "stream error");
			} catch {
				setErrMsg("stream error");
			}
			// keep streaming; server keeps the connection open
		});

		// transport-level errors (no `data`): browser is reconnecting
		es.onerror = () => {
			if (es.readyState === EventSource.CONNECTING) {
				setState("reconnecting");
			} else if (es.readyState === EventSource.CLOSED) {
				setState("closed");
			}
		};

		return () => {
			es.close();
		};
	}, [deploymentId]);

	// auto-scroll when user is at the bottom
	React.useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		if (stickToBottom.current) {
			el.scrollTop = el.scrollHeight;
		}
	}, [entries]);

	const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const el = e.currentTarget;
		stickToBottom.current =
			el.scrollHeight - (el.scrollTop + el.clientHeight) < 40;
	};

	return (
		<div className="flex flex-col">
			<div
				ref={scrollRef}
				onScroll={onScroll}
				className="h-[420px] overflow-y-auto bg-background px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/90"
			>
				{entries.length === 0 && state !== "error" && (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						{state === "connecting" || state === "replaying"
							? "connecting…"
							: "no output yet"}
					</div>
				)}
				{entries.map((e, i) => {
					const { level, text } = parseLevel(e.line);
					return (
						<div key={`${e.t}-${i}`} className="flex gap-3 whitespace-pre-wrap break-all">
							<span className="shrink-0 select-none text-muted-foreground/60 tabular-nums">
								{formatNsTime(e.t)}
							</span>
							<span className={level ? LEVEL_CLASS[level] : undefined}>{text}</span>
						</div>
					);
				})}
				{state === "error" && errMsg && (
					<div className="mt-2 text-[var(--status-failed,#e06b6b)]">
						! {errMsg}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-[10px] tracking-[0.06em] uppercase text-muted-foreground">
				<span className="bp-caption tabular-nums">{entries.length} lines</span>
				<span className="inline-flex items-center gap-1.5">
					<StatusDot state={state} />
					<span>{labelFor(state)}</span>
				</span>
			</div>
		</div>
	);
}

function StatusDot({ state }: { state: State }) {
	const color =
		state === "live"
			? "bg-[var(--status-completed,#3da471)]"
			: state === "replaying" || state === "connecting" || state === "reconnecting"
				? "bg-amber-400/80 animate-pulse"
				: state === "error"
					? "bg-[var(--status-failed,#e06b6b)]"
					: "bg-muted-foreground/60";
	return <span className={`size-1.5 rounded-full ${color}`} aria-hidden />;
}

function labelFor(state: State): string {
	switch (state) {
		case "connecting":
			return "connecting";
		case "replaying":
			return "replaying history";
		case "live":
			return "live · tailing";
		case "reconnecting":
			return "reconnecting";
		case "error":
			return "error";
		case "closed":
			return "disconnected";
	}
}

type LogLevel = "error" | "warning" | "info" | "debug" | "success";

const LEVEL_CLASS: Record<LogLevel, string> = {
	error: "text-[var(--status-failed,#e06b6b)]",
	warning: "text-amber-400",
	info: "text-sky-400",
	debug: "text-muted-foreground",
	success: "text-[var(--status-completed,#3da471)]",
};

const LEVEL_RE = /\[(ERROR|ERR|WARNING|WARN|INFO|DEBUG|DBG|SUCCESS|OK)\]:?\s*/i;

function parseLevel(line: string): { level: LogLevel | null; text: string } {
	const m = LEVEL_RE.exec(line);
	if (!m) return { level: null, text: line };
	const tag = m[1].toUpperCase();
	const level: LogLevel =
		tag === "ERR" ? "error"
		: tag === "WARN" ? "warning"
		: tag === "DBG" ? "debug"
		: tag === "OK" ? "success"
		: (tag.toLowerCase() as LogLevel);
	const text = (line.slice(0, m.index) + line.slice(m.index + m[0].length)).trimStart();
	return { level, text };
}

const NS_PER_MS = BigInt(1_000_000);

function formatNsTime(ns: string): string {
	// ns string -> wall-clock YYYY-MM-DD HH:MM:SS.mmm
	try {
		const ms = Number(BigInt(ns) / NS_PER_MS);
		const d = new Date(ms);
		const yyyy = d.getFullYear();
		const mo = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		const hh = String(d.getHours()).padStart(2, "0");
		const mm = String(d.getMinutes()).padStart(2, "0");
		const ss = String(d.getSeconds()).padStart(2, "0");
		const mmm = String(d.getMilliseconds()).padStart(3, "0");
		return `${yyyy}-${mo}-${dd} ${hh}:${mm}:${ss}.${mmm}`;
	} catch {
		return "";
	}
}

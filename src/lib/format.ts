export function formatMb(mb: number): string {
	if (mb >= 1024) {
		const gb = mb / 1024;
		return `${gb >= 100 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
	}
	return `${mb} MB`;
}

export function shortId(id: string, head = 6, tail = 4): string {
	if (id.length <= head + tail + 1) return id;
	return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

export function relativeTime(input: number | string | Date): string {
	const date = typeof input === "number" || typeof input === "string" ? new Date(input) : input;
	const diff = Date.now() - date.getTime();
	const sec = Math.round(diff / 1000);
	if (sec < 5) return "just now";
	if (sec < 60) return `${sec}s ago`;
	const min = Math.round(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.round(hr / 24);
	if (day < 7) return `${day}d ago`;
	const wk = Math.round(day / 7);
	if (wk < 5) return `${wk}w ago`;
	return date.toISOString().slice(0, 10);
}

export function isoDate(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

export function pad(n: number, width: number): string {
	return String(n).padStart(width, "0");
}

export function pageRevisionStamp(slug: string, date: Date = new Date()): {
	rev: string;
	scale: string;
	date: string;
	slug: string;
} {
	const day = pad(date.getDate(), 2);
	const month = pad(date.getMonth() + 1, 2);
	const rev = `rev.${pad((date.getFullYear() % 100) * 100 + date.getMonth() + 1, 4)}`;
	return {
		rev,
		scale: "scale 1:1",
		date: `${date.getFullYear()}/${month}/${day}`,
		slug: slug.toUpperCase(),
	};
}

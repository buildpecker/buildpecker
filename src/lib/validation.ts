export const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/;

export function isValidGithubRepoUrl(url: string): boolean {
	return GITHUB_REPO_REGEX.test(url.trim());
}

export function deriveProjectNameFromRepoUrl(url: string): string {
	const tail = url.trim().split("/").reverse()[0] ?? "";
	return tail.replace(/\.git\/?$/, "").replace(/\/$/, "");
}

export type ParsedEnvLine =
	| { kind: "empty"; raw: string; line: number }
	| { kind: "comment"; raw: string; line: number }
	| { kind: "ok"; raw: string; line: number; key: string; value: string }
	| { kind: "invalid"; raw: string; line: number; reason: string };

export function parseEnvString(input: string): ParsedEnvLine[] {
	return input.split("\n").map((raw, i) => {
		const line = i + 1;
		const trimmed = raw.trim();
		if (trimmed === "") return { kind: "empty", raw, line };
		if (trimmed.startsWith("#")) return { kind: "comment", raw, line };
		const eq = trimmed.indexOf("=");
		if (eq < 1) return { kind: "invalid", raw, line, reason: "missing =" };
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			return { kind: "invalid", raw, line, reason: "invalid key" };
		}
		return { kind: "ok", raw, line, key, value };
	});
}

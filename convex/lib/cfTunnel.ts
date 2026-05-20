type IngressRule = { hostname?: string; service: string; originRequest?: unknown };

function cfHeaders() {
	return {
		"Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN!}`,
		"Content-Type": "application/json",
	};
}

export async function applyIngressRule(
	tunnelId: string,
	hostname: string,
	service: string,
): Promise<void> {
	const acct = process.env.CLOUDFLARE_ACCOUNT_ID!;
	const headers = cfHeaders();
	const url = `https://api.cloudflare.com/client/v4/accounts/${acct}/cfd_tunnel/${tunnelId}/configurations`;

	const getRes = await fetch(url, { headers });
	if (!getRes.ok) throw new Error(`Cloudflare tunnel config read failed: ${await getRes.text()}`);
	const getJson = await getRes.json();
	const existing: IngressRule[] = getJson.result?.config?.ingress ?? [];

	const ingress: IngressRule[] = [
		...existing.filter((r) => r.hostname && r.hostname !== hostname),
		{ hostname, service, originRequest: {} },
		{ service: "http_status:404" },
	];

	const putRes = await fetch(url, {
		method: "PUT",
		headers,
		body: JSON.stringify({ config: { ingress } }),
	});
	if (!putRes.ok) throw new Error(`Cloudflare ingress update failed: ${await putRes.text()}`);
}

export async function ensureDnsCname(hostname: string, tunnelId: string): Promise<void> {
	const zone = process.env.CLOUDFLARE_ZONE_ID!;
	const headers = cfHeaders();

	const desired = `${tunnelId}.cfargotunnel.com`;

	const lookupUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`;
	const lookupRes = await fetch(lookupUrl, { headers });
	if (!lookupRes.ok) throw new Error(`Cloudflare DNS lookup failed: ${await lookupRes.text()}`);
	const lookupJson = await lookupRes.json();
	const existing = lookupJson.result?.[0];

	if (existing) {
		if (existing.content === desired && existing.proxied === true) return;
		const patchRes = await fetch(
			`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${existing.id}`,
			{
				method: "PATCH",
				headers,
				body: JSON.stringify({ type: "CNAME", proxied: true, name: hostname, content: desired }),
			},
		);
		if (!patchRes.ok) throw new Error(`Cloudflare DNS update failed: ${await patchRes.text()}`);
		return;
	}

	const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			type: "CNAME",
			proxied: true,
			name: hostname,
			content: desired,
		}),
	});
	if (!dnsRes.ok) throw new Error(`Cloudflare DNS create failed: ${await dnsRes.text()}`);
}

export async function removeIngressRule(tunnelId: string, hostname: string): Promise<void> {
	const acct = process.env.CLOUDFLARE_ACCOUNT_ID!;
	const headers = cfHeaders();
	const url = `https://api.cloudflare.com/client/v4/accounts/${acct}/cfd_tunnel/${tunnelId}/configurations`;

	const getRes = await fetch(url, { headers });
	if (!getRes.ok) throw new Error(`Cloudflare tunnel config read failed: ${await getRes.text()}`);
	const getJson = await getRes.json();
	const existing: IngressRule[] = getJson.result?.config?.ingress ?? [];

	const ingress: IngressRule[] = existing.filter((r) => r.hostname && r.hostname !== hostname);
	if (!ingress.some((r) => r.service === "http_status:404")) {
		ingress.push({ service: "http_status:404" });
	}

	const putRes = await fetch(url, {
		method: "PUT",
		headers,
		body: JSON.stringify({ config: { ingress } }),
	});
	if (!putRes.ok) throw new Error(`Cloudflare ingress remove failed: ${await putRes.text()}`);
}

export async function removeDnsCname(hostname: string): Promise<void> {
	const zone = process.env.CLOUDFLARE_ZONE_ID!;
	const headers = cfHeaders();
	const lookupUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`;
	const res = await fetch(lookupUrl, { headers });
	if (!res.ok) throw new Error(`Cloudflare DNS lookup failed: ${await res.text()}`);
	const json = await res.json();
	for (const rec of json.result ?? []) {
		await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${rec.id}`, {
			method: "DELETE",
			headers,
		});
	}
}

export async function deleteTunnel(tunnelId: string): Promise<void> {
	const acct = process.env.CLOUDFLARE_ACCOUNT_ID!;
	const headers = cfHeaders();
	const base = `https://api.cloudflare.com/client/v4/accounts/${acct}/cfd_tunnel/${tunnelId}`;

	await fetch(`${base}/connections`, { method: "DELETE", headers });

	const res = await fetch(base, { method: "DELETE", headers });
	if (!res.ok) throw new Error(`Cloudflare tunnel delete failed: ${await res.text()}`);
}

export async function deleteDnsByTunnel(tunnelId: string): Promise<void> {
	const zone = process.env.CLOUDFLARE_ZONE_ID!;
	const headers = cfHeaders();
	const target = `${tunnelId}.cfargotunnel.com`;

	const listUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=CNAME&content=${encodeURIComponent(target)}`;
	const res = await fetch(listUrl, { headers });
	if (!res.ok) throw new Error(`Cloudflare DNS lookup failed: ${await res.text()}`);
	const json = await res.json();

	for (const rec of json.result ?? []) {
		await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${rec.id}`, {
			method: "DELETE",
			headers,
		});
	}
}

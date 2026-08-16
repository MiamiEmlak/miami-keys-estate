export type EspoLeadPayload = {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  description?: string;
};

export async function createEspoLead(payload: EspoLeadPayload) {
  const baseUrl = process.env["ESPO_API_URL"];
  const apiKey = process.env["ESPO_API_KEY"];
  if (!baseUrl || !apiKey) return { ok: false as const, error: "CRM is not configured." };

  const [firstName, ...rest] = payload.name.trim().split(/\s+/);
  const body: Record<string, unknown> = {
    firstName: rest.length ? firstName : undefined,
    lastName: rest.length ? rest.join(" ") : payload.name.trim(),
    emailAddress: payload.email || undefined,
    phoneNumber: payload.phone || undefined,
    source: payload.source || "Web Site",
    description: payload.description || undefined,
  };

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/Lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("EspoCRM lead failed", res.status, text.slice(0, 300));
      return { ok: false as const, error: `CRM rejected the lead (${res.status}).` };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true as const, id: data?.id ?? null };
  } catch (err) {
    console.error("EspoCRM lead error", err);
    return { ok: false as const, error: "Could not reach the CRM." };
  }
}
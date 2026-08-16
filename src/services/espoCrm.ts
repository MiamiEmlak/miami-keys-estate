import { createEspoLeadFn } from "@/lib/espocrm.functions";

export type EspoLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  description?: string;
};

/**
 * Sends a Lead to EspoCRM. The request is proxied through a server function so
 * the EspoCRM API key never reaches the browser bundle.
 */
export async function submitEspoLead(input: EspoLeadInput) {
  try {
    return await createEspoLeadFn({ data: input });
  } catch {
    return { ok: false as const, error: "Could not reach the CRM." };
  }
}

/* ------------------------------------------------------------------ *
 * EspoCRM LeadCapture endpoint (public capture key, browser-callable)
 * ------------------------------------------------------------------ */

export type EspoLeadCapturePayload = {
  firstName?: string | undefined;
  lastName: string;
  email?: string | undefined;
  phoneNumber?: string | undefined;
  leadSource?: string | undefined;
  buyingTimeline?: string | undefined;
  preferredNeighborhoods?: string[] | undefined;
  maxBudget?: number | undefined;
  minCapRate?: number | undefined;
  monitoredBuildings?: string[] | undefined;
  interactionContext?: string | undefined;
};

const QUEUE_KEY = "espo:lead-capture:queue";
const MAX_QUEUE = 25;

export const espoCaptureUrl = () =>
  `https://crm.cays.com/api/v1/LeadCapture/${import.meta.env["VITE_ESPO_API_KEY"] ?? ""}`;

type QueuedLead = { payload: EspoLeadCapturePayload; queuedAt: string };

function readQueue(): QueuedLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as QueuedLead[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedLead[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    /* storage unavailable — drop silently */
  }
}

export function queuedLeadCount() {
  return readQueue().length;
}

export function enqueueLead(payload: EspoLeadCapturePayload) {
  writeQueue([...readQueue(), { payload, queuedAt: new Date().toISOString() }]);
}

function clean(payload: EspoLeadCapturePayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "",
    ),
  );
}

/** POSTs one lead to the LeadCapture endpoint. Never throws. */
export async function postLeadCapture(
  payload: EspoLeadCapturePayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(espoCaptureUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean(payload)),
    });
    if (!res.ok) return { ok: false, error: `CRM rejected the lead (${res.status}).` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the CRM." };
  }
}

/** Submits a lead; on failure the payload is queued in localStorage for retry. */
export async function captureLead(payload: EspoLeadCapturePayload) {
  const result = await postLeadCapture(payload);
  if (!result.ok) enqueueLead(payload);
  return result;
}

/** Replays queued leads. Returns how many were delivered / still pending. */
export async function flushLeadQueue() {
  const queue = readQueue();
  if (queue.length === 0) return { sent: 0, pending: 0 };
  const pending: QueuedLead[] = [];
  let sent = 0;
  for (const item of queue) {
    const result = await postLeadCapture(item.payload);
    if (result.ok) sent += 1;
    else pending.push(item);
  }
  writeQueue(pending);
  return { sent, pending: pending.length };
}
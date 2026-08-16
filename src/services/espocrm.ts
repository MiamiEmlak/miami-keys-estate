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
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createEspoLead } from "./espocrm.server";

const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(60).optional(),
  source: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
});

export const createEspoLeadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => createEspoLead(data));
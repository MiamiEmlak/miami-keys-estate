// Server-only: extracts unit inventory and deposit schedules from a developer PDF
// stored in the private `developer-docs` bucket, using the Lovable AI Gateway.

export type ParsedUnit = {
  floor_plan_line: string | null;
  unit_number: string | null;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  interior_sqft: number | null;
  balcony_sqft: number | null;
  price: number | null;
  view_description: string | null;
};

export type ParsedMilestone = {
  milestone: string;
  percent: number;
  due_label: string | null;
};

export type ParsedBrochure = {
  units: ParsedUnit[];
  schedule: ParsedMilestone[];
  notes: string | null;
};

const PROMPT = `You extract structured data from Miami pre-construction condo brochures and price sheets.
Return JSON only, no prose, matching:
{"units":[{"floor_plan_line":string|null,"unit_number":string|null,"floor":number|null,"bedrooms":number|null,"bathrooms":number|null,"interior_sqft":number|null,"balcony_sqft":number|null,"price":number|null,"view_description":string|null}],
"schedule":[{"milestone":string,"percent":number,"due_label":string|null}],
"notes":string|null}
Only include units and deposit milestones actually present in the document. Percentages are numbers (20 not "20%").`;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function parseJson(text: string): ParsedBrochure {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const raw = JSON.parse(slice) as Partial<ParsedBrochure>;
  return {
    units: Array.isArray(raw.units) ? raw.units : [],
    schedule: Array.isArray(raw.schedule) ? raw.schedule : [],
    notes: typeof raw.notes === "string" ? raw.notes : null,
  };
}

export async function parseDeveloperPdf(storagePath: string): Promise<ParsedBrochure> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: file, error } = await supabaseAdmin.storage
    .from("developer-docs")
    .download(storagePath);
  if (error || !file) throw new Error(error?.message ?? "Could not read the uploaded document.");

  const base64 = toBase64(new Uint8Array(await file.arrayBuffer()));

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the unit inventory and deposit schedule." },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Rate limit reached — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) {
    console.error("parseDeveloperPdf gateway error", res.status, await res.text());
    throw new Error(`Document parsing failed (${res.status}).`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  try {
    return parseJson(content);
  } catch {
    throw new Error("The AI response could not be read as structured data. Try another file.");
  }
}
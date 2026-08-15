// Server-only: Lovable AI Gateway assistant that can query the Trestle MLS feed.
import { searchListings, type SearchParamsInput } from "./listings.server";

export type AskMessage = { role: "user" | "assistant"; content: string };

export type CompactListing = {
  listing_key: string;
  price: number | null;
  address: string | null;
  city: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  hoa: number | null;
  photo: string | null;
};

const SYSTEM = `You are Cays AI, a Miami real estate assistant for Cays Realty.
You help users find Miami properties, understand rental yields and read market trends.
When a request implies looking for listings, call search_listings with the best filters you can infer.
Miami cities you can use: Miami, Miami Beach, Sunny Isles Beach, Coral Gables, Aventura, Bal Harbour.
Brickell, Edgewater, Downtown and Wynwood are neighborhoods inside the city "Miami".
Never ask the user for permission or clarification before searching — always call search_listings first with your best guess,
then explain any approximations in your answer.
Keep answers under 120 words, concrete and never invent listings — only reference the ones returned by the tool.`;

const TOOL = {
  type: "function",
  function: {
    name: "search_listings",
    description: "Search live Miami MLS listings.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. Miami or Miami Beach" },
        zip: { type: "string" },
        type: { type: "string", enum: ["buy", "rent", "investment"] },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
        beds: { type: "number" },
        baths: { type: "number" },
        sort: { type: "string", enum: ["newest", "price_asc", "price_desc"] },
        filter: { type: "string", enum: ["price_drops"] },
        maxHoa: { type: "number", description: "Maximum monthly HOA fee" },
      },
      additionalProperties: false,
    },
  },
} as const;

type GatewayMessage = {
  role: string;
  content?: string | null;
  tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

async function callGateway(apiKey: string, messages: GatewayMessage[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, tools: [TOOL] }),
  });
  if (res.status === 429) throw new Error("Rate limit reached — please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return (await res.json()) as { choices: { message: GatewayMessage }[] };
}

export async function askCays(input: { messages: AskMessage[] }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey)
    return { reply: "AI is not configured yet.", listings: [] as CompactListing[], search: null };

  const history: GatewayMessage[] = [
    { role: "system", content: SYSTEM },
    ...input.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
  ];

  const first = await callGateway(apiKey, history);
  const message = first.choices[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (!toolCall) {
    return {
      reply: message?.content ?? "Sorry, I couldn't answer that.",
      listings: [] as CompactListing[],
      search: null,
    };
  }

  let args: SearchParamsInput & { maxHoa?: number } = {};
  try {
    args = JSON.parse(toolCall.function.arguments || "{}") as SearchParamsInput & {
      maxHoa?: number;
    };
  } catch {
    args = {};
  }

  const { maxHoa, ...searchArgs } = args;
  const result = await searchListings({ ...searchArgs, pageSize: 12, page: 1 });
  const filtered = maxHoa
    ? result.items.filter((i) => (i.association_fee ?? 0) <= maxHoa)
    : result.items;
  const compact: CompactListing[] = filtered.slice(0, 6).map((i) => ({
    listing_key: i.listing_key,
    price: i.list_price,
    address: i.street_address,
    city: i.city,
    beds: i.bedrooms_total,
    baths: i.bathrooms_total,
    sqft: i.living_area,
    hoa: i.association_fee,
    photo: i.photo,
  }));

  history.push({
    role: "assistant",
    content: message?.content ?? "",
    ...(message?.tool_calls ? { tool_calls: message.tool_calls } : {}),
  });
  history.push({
    role: "tool",
    tool_call_id: toolCall.id,
    content: JSON.stringify({ total: result.total, items: compact }),
  });

  const second = await callGateway(apiKey, history);
  const search = {
    city: args.city ?? null,
    zip: args.zip ?? null,
    type: args.type ?? null,
    minPrice: args.minPrice ?? null,
    maxPrice: args.maxPrice ?? null,
    beds: args.beds ?? null,
  };

  return {
    reply: second.choices[0]?.message?.content ?? "Here is what I found.",
    listings: compact,
    search,
  };
}
import { createServerFn } from "@tanstack/react-start";
import type { AskMessage } from "./ask.server";

export const askCaysFn = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: AskMessage[] }) => ({
    messages: (input?.messages ?? []).slice(-8).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 2000),
    })),
  }))
  .handler(async ({ data }) => {
    const { askCays } = await import("./ask.server");
    return askCays(data);
  });
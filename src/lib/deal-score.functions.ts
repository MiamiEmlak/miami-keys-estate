import { createServerFn } from "@tanstack/react-start";

export const getDealScoreFn = createServerFn({ method: "POST" })
  .inputValidator((input: { listingKey: string }) => ({ listingKey: String(input.listingKey) }))
  .handler(async ({ data }) => {
    const { scoreListing } = await import("./deal-score.server");
    return scoreListing(data.listingKey);
  });
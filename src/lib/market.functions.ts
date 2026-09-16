import { createServerFn } from "@tanstack/react-start";

export const getNeighborhoodDirectoryFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getNeighborhoodDirectory } = await import("./market.server");
  return getNeighborhoodDirectory();
});

export const getNeighborhoodProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug) }))
  .handler(async ({ data }) => {
    const { getNeighborhoodProfile } = await import("./market.server");
    return getNeighborhoodProfile(data.slug);
  });

export const getHomesIndexFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { city?: string; minPrice?: number; maxPrice?: number; beds?: number } | undefined) => ({
      city: input?.city,
      minPrice: input?.minPrice,
      maxPrice: input?.maxPrice,
      beds: input?.beds,
    }),
  )
  .handler(async ({ data }) => {
    const { getHomesIndex } = await import("./market.server");
    return getHomesIndex(data);
  });

export const getHomeProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug) }))
  .handler(async ({ data }) => {
    const { getHomeProfile } = await import("./market.server");
    return getHomeProfile(data.slug);
  });

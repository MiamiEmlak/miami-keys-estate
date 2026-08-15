import { createServerFn } from "@tanstack/react-start";

export const getBuildingDirectoryFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getBuildingDirectory } = await import("./buildings.server");
  return getBuildingDirectory();
});

export const getBuildingProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug) }))
  .handler(async ({ data }) => {
    const { getBuildingProfile } = await import("./buildings.server");
    return getBuildingProfile(data.slug);
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// "trestle-properties" backend entry point.
// Runs server-side only; Trestle credentials never reach the browser.
export const trestleProperties = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { city?: string; top?: number } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Forbidden");

    const {
      readTrestleEnv,
      trestleGet,
      normalizeProperty,
      normalizeMedia,
    } = await import("./trestle.server");

    const { env, missing } = readTrestleEnv();
    if (!env) {
      return {
        connected: false as const,
        missingEnv: missing,
        count: 0,
        properties: [],
        media: [],
        error: `Missing environment variables: ${missing.join(", ")}`,
      };
    }

    const top = Math.min(Math.max(data.top ?? 5, 1), 50);
    const filter = ["StandardStatus eq 'Active'"];
    if (data.city) filter.push(`City eq '${data.city.replace(/'/g, "''")}'`);

    try {
      const result = await trestleGet(env, "Property", {
        $top: String(top),
        $count: "true",
        $filter: filter.join(" and "),
        $orderby: "ModificationTimestamp desc",
      });
      const properties = result.value.map(normalizeProperty);

      let media: ReturnType<typeof normalizeMedia>[] = [];
      const firstKey = properties[0]?.listing_key;
      if (firstKey) {
        const mediaResult = await trestleGet(env, "Media", {
          $top: "10",
          $filter: `ResourceRecordKey eq '${firstKey.replace(/'/g, "''")}'`,
        });
        media = mediaResult.value.map(normalizeMedia);
      }

      return {
        connected: true as const,
        missingEnv: [] as string[],
        count: result.count ?? properties.length,
        properties,
        media,
        error: null as string | null,
      };
    } catch (error) {
      console.error("trestle-properties failed", error);
      return {
        connected: false as const,
        missingEnv: [] as string[],
        count: 0,
        properties: [] as ReturnType<typeof normalizeProperty>[],
        media: [] as ReturnType<typeof normalizeMedia>[],
        error: error instanceof Error ? error.message : "Unknown Trestle error",
      };
    }
  });

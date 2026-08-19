import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: { from: Function }; userId: string }) {
  const { data } = await (context.supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Admin-only: run the developer brochure through the document parser. */
export const parseDeveloperPdfFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storagePath: string }) => ({ storagePath: String(input.storagePath) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { parseDeveloperPdf } = await import("./developer-pdf.server");
    return parseDeveloperPdf(data.storagePath);
  });

/** Public: hands back a short-lived brochure link once a VIP lead is captured. */
export const requestBrochureFn = createServerFn({ method: "POST" })
  .inputValidator((input: { documentId: string; name: string; email: string; phone?: string }) => {
    const name = String(input.name ?? "").trim();
    const email = String(input.email ?? "").trim();
    if (name.length < 2) throw new Error("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Please enter a valid email.");
    return {
      documentId: String(input.documentId),
      name,
      email,
      phone: String(input.phone ?? "").trim(),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc } = await supabaseAdmin
      .from("developer_documents")
      .select("storage_path, title")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { url: null as string | null, error: "That brochure is no longer available." };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("developer-docs")
      .createSignedUrl(doc.storage_path, 60 * 10);
    if (error || !signed)
      return { url: null as string | null, error: "Could not prepare the download link." };

    await supabaseAdmin.from("leads").insert({
      full_name: data.name,
      email: data.email,
      phone: data.phone || null,
      source: "New Development VIP Brochure",
      notes: `Requested "${doc.title}" (pre-construction, HOT)`,
    });

    return { url: signed.signedUrl, error: null as string | null };
  });
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseDeveloperPdfFn } from "@/lib/new-developments.functions";
import type { ParsedMilestone, ParsedUnit } from "@/lib/developer-pdf.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/new-projects")({
  head: () => ({
    meta: [
      { title: "New Developments Admin | Cays Realty" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNewProjects,
});

type DevRow = { id: string; name: string; slug: string };

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const emptyDev = {
  name: "",
  developer_name: "",
  city: "Miami",
  neighborhood: "",
  description: "",
  hero_image_url: "",
  starting_price: "",
  completion_date: "",
  str_friendly: false,
};

function AdminNewProjects() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState(emptyDev);
  const [creating, setCreating] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [units, setUnits] = useState<ParsedUnit[]>([]);
  const [schedule, setSchedule] = useState<ParsedMilestone[]>([]);
  const [saving, setSaving] = useState(false);

  const developments = useQuery({
    queryKey: ["admin-new-developments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_developments")
        .select("id, name, slug")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as DevRow[];
    },
  });

  async function createDevelopment(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase
      .from("new_developments")
      .insert({
        name: form.name,
        slug: slugify(form.name),
        developer_name: form.developer_name || null,
        city: form.city || null,
        neighborhood: form.neighborhood || null,
        description: form.description || null,
        hero_image_url: form.hero_image_url || null,
        starting_price: form.starting_price ? Number(form.starting_price) : null,
        completion_date: form.completion_date || null,
        str_friendly: form.str_friendly,
      })
      .select("id")
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Development created");
    setSelectedId(data.id);
    setForm(emptyDev);
    void developments.refetch();
  }

  async function uploadDoc(file: File) {
    if (!selectedId) {
      toast.error("Select or create a development first.");
      return;
    }
    setUploading(true);
    const path = `${selectedId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("developer-docs").upload(path, file);
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { error: rowError } = await supabase.from("developer_documents").insert({
      development_id: selectedId,
      title: file.name,
      storage_path: path,
    });
    setUploading(false);
    if (rowError) {
      toast.error(rowError.message);
      return;
    }
    setDocPath(path);
    toast.success("Document uploaded");
  }

  async function runParse() {
    if (!docPath) return;
    setParsing(true);
    try {
      const res = await parseDeveloperPdfFn({ data: { storagePath: docPath } });
      setUnits(res.units);
      setSchedule(res.schedule);
      toast.success(`Parsed ${res.units.length} units and ${res.schedule.length} milestones`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Parsing failed");
    } finally {
      setParsing(false);
    }
  }

  async function saveParsed() {
    if (!selectedId) return;
    setSaving(true);
    const unitRows = units.map((u) => ({ ...u, development_id: selectedId }));
    const scheduleRows = schedule.map((s, i) => ({
      development_id: selectedId,
      milestone: s.milestone,
      percent: Number(s.percent) || 0,
      due_label: s.due_label,
      sort_order: i,
    }));

    const results = await Promise.all([
      unitRows.length ? supabase.from("building_units").insert(unitRows) : null,
      scheduleRows.length ? supabase.from("deposit_schedules").insert(scheduleRows) : null,
    ]);
    setSaving(false);
    const failure = results.find((r) => r?.error);
    if (failure?.error) {
      toast.error(failure.error.message);
      return;
    }
    toast.success("Inventory saved");
    setUnits([]);
    setSchedule([]);
  }

  const setUnit = (index: number, key: keyof ParsedUnit, value: string) =>
    setUnits((prev) =>
      prev.map((u, i) =>
        i === index
          ? {
              ...u,
              [key]:
                key === "floor_plan_line" || key === "unit_number" || key === "view_description"
                  ? value || null
                  : value === ""
                    ? null
                    : Number(value),
            }
          : u,
      ),
    );

  const UNIT_COLS: { key: keyof ParsedUnit; label: string }[] = [
    { key: "floor_plan_line", label: "Line" },
    { key: "unit_number", label: "Unit" },
    { key: "floor", label: "Floor" },
    { key: "bedrooms", label: "Beds" },
    { key: "bathrooms", label: "Baths" },
    { key: "interior_sqft", label: "Interior" },
    { key: "balcony_sqft", label: "Balcony" },
    { key: "price", label: "Price" },
    { key: "view_description", label: "View" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 pb-24">
      <p className="eyebrow text-muted-foreground">Admin</p>
      <h1 className="mt-3 font-display text-4xl">New developments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create a project, upload the developer PDF, parse it, then review and save the inventory.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-6">
          <h2 className="font-display text-2xl">1. Create a development</h2>
          <form onSubmit={createDevelopment} className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["name", "Project name", "text"],
              ["developer_name", "Developer", "text"],
              ["city", "City", "text"],
              ["neighborhood", "Neighborhood", "text"],
              ["starting_price", "Starting price", "number"],
              ["completion_date", "Completion date", "date"],
              ["hero_image_url", "Hero image URL", "url"],
            ].map(([key, label, type]) => (
              <div key={key}>
                <Label htmlFor={`nd-${key}`}>{label}</Label>
                <Input
                  id={`nd-${key}`}
                  type={type}
                  required={key === "name"}
                  value={String(form[key as keyof typeof form] ?? "")}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-2"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="nd-description">Description</Label>
              <Textarea
                id="nd-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="nd-str-admin"
                checked={form.str_friendly}
                onCheckedChange={(v) => setForm({ ...form, str_friendly: v })}
              />
              <Label htmlFor="nd-str-admin">STR / flexible leasing friendly</Label>
            </div>
            <Button type="submit" disabled={creating} className="sm:col-span-2">
              <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "Create development"}
            </Button>
          </form>
        </section>

        <section className="rounded-sm border border-border bg-card p-6">
          <h2 className="font-display text-2xl">2. Upload & parse the developer PDF</h2>
          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="nd-select">Active development</Label>
              <select
                id="nd-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-2 h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a development…</option>
                {(developments.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="nd-file">Developer document (PDF)</Label>
              <Input
                id="nd-file"
                type="file"
                accept="application/pdf"
                disabled={!selectedId || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadDoc(file);
                }}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </span>
                ) : docPath ? (
                  <span className="flex items-center gap-2">
                    <FileUp className="h-3 w-3" /> {docPath.split("/").pop()}
                  </span>
                ) : (
                  "Stored privately in the developer-docs bucket."
                )}
              </p>
            </div>

            <Button onClick={() => void runParse()} disabled={!docPath || parsing}>
              {parsing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {parsing ? "Parsing document…" : "Parse developer PDF"}
            </Button>
          </div>
        </section>
      </div>

      {(units.length > 0 || schedule.length > 0) && (
        <section className="mt-12 rounded-sm border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-2xl">3. Review & save</h2>
            <Button onClick={() => void saveParsed()} disabled={saving || !selectedId}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save to database"}
            </Button>
          </div>

          <h3 className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">
            Building units ({units.length})
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  {UNIT_COLS.map((c) => (
                    <th key={String(c.key)} className="px-2 py-2 font-normal">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {units.map((u, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {UNIT_COLS.map((c) => (
                      <td key={String(c.key)} className="px-1 py-1">
                        <Input
                          value={u[c.key] === null || u[c.key] === undefined ? "" : String(u[c.key])}
                          onChange={(e) => setUnit(i, c.key, e.target.value)}
                          className="h-9 min-w-24"
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove unit"
                        onClick={() => setUnits(units.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">
            Deposit schedule ({schedule.length})
          </h3>
          <div className="mt-3 space-y-2">
            {schedule.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_8rem_1fr_3rem]">
                <Input
                  value={s.milestone}
                  onChange={(e) =>
                    setSchedule(
                      schedule.map((x, idx) => (idx === i ? { ...x, milestone: e.target.value } : x)),
                    )
                  }
                  className="h-9"
                />
                <Input
                  type="number"
                  value={String(s.percent)}
                  onChange={(e) =>
                    setSchedule(
                      schedule.map((x, idx) =>
                        idx === i ? { ...x, percent: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  className="h-9"
                />
                <Input
                  value={s.due_label ?? ""}
                  onChange={(e) =>
                    setSchedule(
                      schedule.map((x, idx) =>
                        idx === i ? { ...x, due_label: e.target.value || null } : x,
                      ),
                    )
                  }
                  className="h-9"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove milestone"
                  onClick={() => setSchedule(schedule.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
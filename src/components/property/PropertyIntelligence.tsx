import { useState } from "react";
import { CalendarCheck, LineChart, Play, Image as ImageIcon } from "lucide-react";
import { useEspoLead } from "@/hooks/useEspoLead";
import { ListingImage } from "@/components/listings/ListingImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { money } from "@/lib/format";

export type PropertyIntelligenceMedia = {
  media_key: string;
  media_url: string | null;
  media_category: string | null;
  short_description: string | null;
};

export type PropertyIntelligenceProps = {
  listingKey: string;
  address: string;
  media?: PropertyIntelligenceMedia[];
  features?: Record<string, string[]>;
  extras?: {
    virtual_tour_url?: string | null;
    association_name?: string | null;
    association_phone?: string | null;
  };
  associationFee?: number | null;
  associationFeeFrequency?: string | null;
  /** Optional hook for the existing showing flow; falls back to the rental modal. */
  onRequestShowing?: () => void;
};

const isFloorPlan = (m: PropertyIntelligenceMedia) =>
  /floor\s*plan/i.test(`${m.media_category ?? ""} ${m.short_description ?? ""}`);

export function PropertyIntelligence({
  listingKey,
  address,
  media = [],
  features = {},
  extras = {},
  associationFee = null,
  associationFeeFrequency = null,
  onRequestShowing,
}: PropertyIntelligenceProps) {
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const photos = media.filter((m) => m.media_url && !isFloorPlan(m));
  const floorPlans = media.filter((m) => m.media_url && isFloorPlan(m));
  const tourUrl = extras.virtual_tour_url ?? null;

  const architecture: [string, string[]][] = [
    ["Roof", features["roof"] ?? []],
    ["Construction", features["construction"] ?? []],
    ["HVAC", [...(features["heating"] ?? []), ...(features["cooling"] ?? [])]],
    ["Flooring", features["flooring"] ?? []],
    ["Pool / Spa", [...(features["pool"] ?? []), ...(features["spa"] ?? [])]],
    ["Security", features["security"] ?? []],
  ];

  const inclusions = features["association_fee_includes"] ?? [];
  const amenities = features["association_amenities"] ?? [];

  return (
    <section className="mt-16" aria-label="Property intelligence">
      <h2 className="font-display text-3xl text-foreground">Property intelligence</h2>

      <Tabs defaultValue="media" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="hoa">HOA</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-6 space-y-8">
          <div>
            <h3 className="eyebrow text-muted-foreground">MLS photos</h3>
            {photos.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.slice(0, 12).map((m) => (
                  <ListingImage
                    key={m.media_key}
                    src={m.media_url}
                    alt={m.short_description || `${address} photo`}
                    className="aspect-[4/3] w-full rounded-sm object-cover"
                  />
                ))}
              </div>
            ) : (
              <EmptyLine icon={<ImageIcon className="h-4 w-4" />} text="No MLS photos published." />
            )}
          </div>

          <div>
            <h3 className="eyebrow text-muted-foreground">Video / virtual tour</h3>
            {tourUrl ? (
              <div className="mt-3 overflow-hidden rounded-sm border border-border">
                <iframe
                  src={tourUrl}
                  title={`Virtual tour of ${address}`}
                  loading="lazy"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              <EmptyLine icon={<Play className="h-4 w-4" />} text="No tour provided for this listing." />
            )}
          </div>

          <div>
            <h3 className="eyebrow text-muted-foreground">Floor plans</h3>
            {floorPlans.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {floorPlans.map((m) => (
                  <ListingImage
                    key={m.media_key}
                    src={m.media_url}
                    alt={m.short_description || `${address} floor plan`}
                    className="aspect-[4/3] w-full rounded-sm border border-border object-contain"
                  />
                ))}
              </div>
            ) : (
              <EmptyLine text="Floor plans available on request." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="architecture" className="mt-6">
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {architecture.map(([label, values]) => (
              <div key={label} className="rounded-sm border border-border bg-card p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
                <dd className="mt-2 text-sm text-foreground">
                  {values.length ? values.join(" · ") : "—"}
                </dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="hoa" className="mt-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-sm border border-border bg-card p-4">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Fee</dt>
              <dd className="mt-2 text-sm text-foreground">
                {associationFee ? money(associationFee) : "—"}
              </dd>
            </div>
            <div className="rounded-sm border border-border bg-card p-4">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Frequency</dt>
              <dd className="mt-2 text-sm text-foreground">{associationFeeFrequency || "—"}</dd>
            </div>
            <div className="rounded-sm border border-border bg-card p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Inclusions</dt>
              <dd className="mt-2 text-sm text-foreground">
                {[...inclusions, ...amenities].length ? [...inclusions, ...amenities].join(" · ") : "—"}
              </dd>
            </div>
            <div className="rounded-sm border border-border bg-card p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                Management contact
              </dt>
              <dd className="mt-2 text-sm text-foreground">
                {extras.association_name || "Association details on request"}
                {extras.association_phone ? ` · ${extras.association_phone}` : ""}
              </dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button
          className="flex-1"
          onClick={() => (onRequestShowing ? onRequestShowing() : setAnalysisOpen(true))}
        >
          <CalendarCheck className="mr-2 h-4 w-4" /> Request showing
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setAnalysisOpen(true)}>
          <LineChart className="mr-2 h-4 w-4" /> Rental analysis
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />

      <RentalAnalysisModal
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        address={address}
        listingKey={listingKey}
      />
    </section>
  );
}

function EmptyLine({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      {text}
    </p>
  );
}

function RentalAnalysisModal({
  open,
  onOpenChange,
  address,
  listingKey,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  address: string;
  listingKey: string;
}) {
  const { submit, isSubmitting } = useEspoLead({
    successMessage: "Rental analysis requested — we'll email it shortly.",
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", capRate: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const result = await submit({
      firstName: rest.length ? firstName : undefined,
      lastName: rest.length ? rest.join(" ") : form.name.trim(),
      email: form.email,
      phoneNumber: form.phone,
      leadSource: "Property Intelligence",
      minCapRate: form.capRate ? Number(form.capRate) : undefined,
      monitoredBuildings: [address],
      interactionContext: `Rental analysis requested for ${address} (MLS ${listingKey}).`,
    });
    if (result.ok) {
      setForm({ name: "", email: "", phone: "", capRate: "" });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Get rental analysis</DialogTitle>
          <DialogDescription>{address}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="ra-name">Name</Label>
            <Input
              id="ra-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ra-email">Email</Label>
            <Input
              id="ra-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ra-phone">Phone</Label>
            <Input
              id="ra-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ra-cap">Target cap rate (%)</Label>
            <Input
              id="ra-cap"
              inputMode="decimal"
              value={form.capRate}
              onChange={(e) => setForm({ ...form, capRate: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Request analysis"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
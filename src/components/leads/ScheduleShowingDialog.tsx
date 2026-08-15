import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TIME_SLOTS = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

export function ScheduleShowingDialog({
  listingKey,
  address,
}: {
  listingKey: string;
  address: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [tour, setTour] = useState<"in_person" | "virtual">("in_person");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(TIME_SLOTS[0]!);
  const [details, setDetails] = useState({ name: "", email: "", phone: "", contact: "email" });

  function reset() {
    setStep(1);
    setTour("in_person");
    setDate("");
    setSlot(TIME_SLOTS[0]!);
    setDetails({ name: "", email: "", phone: "", contact: "email" });
  }

  function next() {
    if (!date) {
      toast.error("Pick a date for the tour.");
      return;
    }
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.name.trim() || !details.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: details.name,
      email: details.email,
      phone: details.phone,
      lead_type: "showing_request",
      source: "property_detail_modal",
      notes: `${tour === "virtual" ? "Virtual tour" : "In-person showing"} for ${address} (MLS ${listingKey}) on ${date} at ${slot}. Preferred contact: ${details.contact}.`,
    });
    setBusy(false);
    if (error) {
      toast.error("We couldn't send that request. Please try again.");
      return;
    }
    toast.success("Showing requested — an advisor will confirm shortly.");
    setStep(3);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarCheck className="mr-2 h-4 w-4" /> Schedule a showing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 3 ? "Request confirmed" : "Schedule a showing"}
          </DialogTitle>
          <DialogDescription>
            {step === 3 ? address : `Step ${step} of 2 · ${address}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Tour type
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ["in_person", "In person"],
                    ["virtual", "Virtual tour"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTour(value)}
                    className={`rounded-sm border px-3 py-2 text-xs uppercase tracking-widest transition-colors ${
                      tour === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="s-date">Date</Label>
              <Input
                id="s-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Time slot
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSlot(t)}
                    className={`rounded-sm border py-2 text-xs ${
                      slot === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={next}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                required
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                required
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-phone">Phone</Label>
              <Input
                id="s-phone"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="s-contact">Preferred contact method</Label>
              <select
                id="s-contact"
                value={details.contact}
                onChange={(e) => setDetails({ ...details, contact: e.target.value })}
                className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
              >
                <option value="email">Email</option>
                <option value="phone">Phone call</option>
                <option value="text">Text message</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy ? "Sending…" : "Request showing"}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-5 py-2 text-sm">
            <div className="flex items-center gap-3 text-foreground">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <p className="font-display text-xl">You're on the calendar</p>
            </div>
            <p className="text-muted-foreground">
              {tour === "virtual" ? "Virtual tour" : "In-person showing"} requested for{" "}
              <span className="text-foreground">{date}</span> at{" "}
              <span className="text-foreground">{slot}</span>. A Cays advisor will confirm by{" "}
              {details.contact === "email" ? "email" : details.contact === "phone" ? "phone" : "text"}.
            </p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

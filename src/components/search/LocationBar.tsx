import { useMemo, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  citiesForCounty,
  neighborhoodsFor,
  COUNTY_NAMES,
  geoDistanceFilter,
  cityFilter,
  type Coords,
  type LocationSelection,
} from "@/types/location";

export type { LocationSelection } from "@/types/location";

type Props = {
  value?: Partial<LocationSelection>;
  onChange: (
    value: LocationSelection & { geoFilter: string | null; cityFilter: string | null },
  ) => void;
  className?: string;
};

const selectClass =
  "h-10 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function LocationBar({ value, onChange, className = "" }: Props) {
  const [county, setCounty] = useState(value?.county ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(value?.neighborhood ?? "");
  const [coords, setCoords] = useState<Coords | null>(value?.coords ?? null);
  const [radiusMiles, setRadiusMiles] = useState(value?.radiusMiles ?? 5);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const cities = useMemo(() => citiesForCounty(county), [county]);
  const neighborhoods = useMemo(() => neighborhoodsFor(county, city), [county, city]);

  const emit = (patch: Partial<LocationSelection>) => {
    const next: LocationSelection = {
      county,
      city,
      neighborhood,
      coords,
      radiusMiles,
      ...patch,
    };
    onChange({
      ...next,
      geoFilter: next.coords ? geoDistanceFilter(next.coords, next.radiusMiles) : null,
      cityFilter: cityFilter(next.city),
    });
  };

  const pickCounty = (next: string) => {
    setCounty(next);
    setCity("");
    setNeighborhood("");
    emit({ county: next, city: "", neighborhood: "" });
  };

  const pickCity = (next: string) => {
    setCity(next);
    setNeighborhood("");
    emit({ city: next, neighborhood: "" });
  };

  const pickNeighborhood = (next: string) => {
    setNeighborhood(next);
    emit({ neighborhood: next });
  };

  const findNearMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location services are not available in this browser.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: Coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        };
        // Start with a radius no tighter than the device's own accuracy.
        const accuracyMiles = Math.max(1, Math.ceil((pos.coords.accuracy || 0) / 1609.344));
        const nextRadius = Math.max(radiusMiles, accuracyMiles);
        setCoords(next);
        setRadiusMiles(nextRadius);
        setLocating(false);
        emit({ coords: next, radiusMiles: nextRadius });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — pick a county instead."
            : "Couldn't determine your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const clearCoords = () => {
    setCoords(null);
    emit({ coords: null });
  };

  return (
    <div className={`rounded-sm border border-border bg-card p-4 ${className}`}>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex flex-col justify-end">
          <Button
            type="button"
            variant={coords ? "default" : "outline"}
            onClick={coords ? clearCoords : findNearMe}
            disabled={locating}
            aria-pressed={!!coords}
            className="h-10 w-full justify-center gap-2"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : coords ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4" aria-hidden />
            )}
            {locating ? "Locating…" : coords ? "Clear location" : "Find Near Me"}
          </Button>
        </div>

        <div>
          <Label htmlFor="loc-county" className="text-xs uppercase tracking-widest text-muted-foreground">
            County
          </Label>
          <select
            id="loc-county"
            className={`mt-1 ${selectClass}`}
            value={county}
            onChange={(e) => pickCounty(e.target.value)}
          >
            <option value="">All counties</option>
            {COUNTY_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="loc-city" className="text-xs uppercase tracking-widest text-muted-foreground">
            City
          </Label>
          <select
            id="loc-city"
            className={`mt-1 ${selectClass}`}
            value={city}
            onChange={(e) => pickCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label
            htmlFor="loc-neighborhood"
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            Neighborhood
          </Label>
          <select
            id="loc-neighborhood"
            className={`mt-1 ${selectClass}`}
            value={neighborhood}
            onChange={(e) => pickNeighborhood(e.target.value)}
            disabled={neighborhoods.length === 0}
          >
            <option value="">All neighborhoods</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {coords && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Search radius
            </Label>
            <span className="text-sm text-foreground">{radiusMiles} mi</span>
          </div>
          <Slider
            className="mt-3"
            min={1}
            max={50}
            step={1}
            value={[radiusMiles]}
            onValueChange={([v]) => setRadiusMiles(v ?? 1)}
            onValueCommit={([v]) => {
              const next = v ?? radiusMiles;
              setRadiusMiles(next);
              emit({ radiusMiles: next });
            }}
            aria-label="Search radius in miles"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Centered on your current position ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}).
          </p>
        </div>
      )}

      {geoError && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {geoError}
        </p>
      )}
    </div>
  );
}

export default LocationBar;
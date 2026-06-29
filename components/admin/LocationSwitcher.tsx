"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { fetchJson, requestJson } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocationOption = {
  organizationId: string;
  organizationName: string;
  locationId: string;
  locationName: string;
  locationLabel: string | null;
};

type LocationPayload = {
  active: {
    organizationId: string;
    locationId: string;
  };
  locations: LocationOption[];
};

function optionValue(option: Pick<LocationOption, "organizationId" | "locationId">) {
  return `${option.organizationId}:${option.locationId}`;
}

export function LocationSwitcher() {
  const [payload, setPayload] = useState<LocationPayload | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadLocations() {
      try {
        setPayload(await fetchJson<LocationPayload>("/api/session/locations"));
      } catch {
        return;
      }
    }

    void loadLocations();
  }, []);

  if (!payload || payload.locations.length <= 1) {
    return null;
  }

  const activeValue = optionValue(payload.active);

  return (
    <div className="min-w-64">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
        Location
      </p>
      <Select
        value={activeValue}
        disabled={isPending}
        onValueChange={(value) => {
          const [organizationId, locationId] = value.split(":");

          startTransition(async () => {
            try {
              await requestJson("/api/session/locations", {
                body: { organizationId, locationId },
                method: "PATCH",
              });
            } catch {
              toast.error("Could not switch location.");
              return;
            }

            toast.success("Location switched.");
            window.location.reload();
          });
        }}
      >
        <SelectTrigger className="h-9 rounded-lg border-stone-600/60 bg-white/5 text-stone-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {payload.locations.map((option) => (
            <SelectItem key={optionValue(option)} value={optionValue(option)}>
              {option.organizationName} - {option.locationLabel ?? option.locationName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { Chip } from "@/components/ui";
import type { WatchDevice } from "@/types/watch";
import { ChipRow, ChoiceGroup, ChoiceLegend } from "./WatchDeviceChoice.style";

type WatchDeviceChoiceProps = {
  /** For example "Steps". */
  metricLabel: string;
  /** Only the devices that have this metric. */
  devices: WatchDevice[];
  /** The parent's choice; null means automatic. */
  selectedId: string | null;
  /** The device the automatic rule picks right now. */
  autoLabel: string | null;
  onSelect: (deviceId: string | null) => void;
};

// Lets the parent pick which device feeds one metric. Devices are never combined.
export function WatchDeviceChoice({
  metricLabel,
  devices,
  selectedId,
  autoLabel,
  onSelect,
}: WatchDeviceChoiceProps) {
  return (
    <ChoiceGroup>
      <ChoiceLegend>{`${metricLabel} from`}</ChoiceLegend>
      <ChipRow>
        <Chip
          label={autoLabel ? `Automatic (${autoLabel})` : "Automatic"}
          selected={selectedId === null}
          onToggle={() => onSelect(null)}
        />
        {devices.map((device) => (
          <Chip
            key={device.id}
            label={device.label}
            selected={selectedId === device.id}
            onToggle={() => onSelect(device.id)}
          />
        ))}
      </ChipRow>
    </ChoiceGroup>
  );
}

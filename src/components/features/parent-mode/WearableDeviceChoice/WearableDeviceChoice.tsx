"use client";

import { Chip } from "@/components/ui";
import type { WearableDevice } from "@/types/wearable";
import { ChipRow, ChoiceGroup, ChoiceLegend } from "./WearableDeviceChoice.style";

type WearableDeviceChoiceProps = {
  /** For example "Steps". */
  metricLabel: string;
  /** Only the devices that have this metric. */
  devices: WearableDevice[];
  /** The parent's choice; null means automatic. */
  selectedId: string | null;
  /** The device the automatic rule picks right now. */
  autoLabel: string | null;
  onSelect: (deviceId: string | null) => void;
};

// Lets the parent pick which device feeds one metric. Devices are never combined.
export function WearableDeviceChoice({
  metricLabel,
  devices,
  selectedId,
  autoLabel,
  onSelect,
}: WearableDeviceChoiceProps) {
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

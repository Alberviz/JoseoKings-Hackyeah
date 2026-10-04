"use client";

import { HomeIcon } from "../HomeIcons";
import { Fill, FlameWrapper, MeterBox, Track, Value } from "./FireMeter.style";

type FireMeterProps = {
  fire: number;
  max: number;
};

export function FireMeter({ fire, max }: FireMeterProps) {
  const percent = Math.min(100, Math.max(0, Math.round((fire / max) * 100)));

  return (
    <MeterBox role="img" aria-label={`Fire ${fire} of ${max}`}>
      <FlameWrapper>
        <HomeIcon iconKey="flame" size={24} />
      </FlameWrapper>
      <Track>
        <Fill $percent={percent} />
      </Track>
      <Value>{fire}</Value>
    </MeterBox>
  );
}

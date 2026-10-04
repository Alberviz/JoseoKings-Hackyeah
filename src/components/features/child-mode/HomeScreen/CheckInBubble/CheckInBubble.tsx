"use client";

import { ROUTES } from "@/config/app";
import { HomeIcon } from "../HomeIcons";
import {
  BubbleFloat,
  BubbleLink,
  BubbleSubtitle,
  BubbleText,
  BubbleTitle,
  DoneChip,
  IconSlot,
} from "./CheckInBubble.style";

type CheckInBubbleProps = {
  isDone: boolean;
};

// Speech bubble that invites the child to the check-in, or a quiet chip once it is done today.
export function CheckInBubble({ isDone }: CheckInBubbleProps) {
  if (isDone) {
    return (
      <DoneChip data-testid="check-in-done">
        <HomeIcon iconKey="check" size={20} />
        Told me today
      </DoneChip>
    );
  }

  return (
    <BubbleFloat>
      <BubbleLink href={ROUTES.checkIn} data-testid="nav-check-in">
        <IconSlot>
          <HomeIcon iconKey="smile" size={36} />
        </IconSlot>
        <BubbleText>
          <BubbleTitle>How are you today?</BubbleTitle>
          <BubbleSubtitle>Tap to tell me with drawings</BubbleSubtitle>
        </BubbleText>
        <IconSlot>
          <HomeIcon iconKey="chevron" size={22} />
        </IconSlot>
      </BubbleLink>
    </BubbleFloat>
  );
}

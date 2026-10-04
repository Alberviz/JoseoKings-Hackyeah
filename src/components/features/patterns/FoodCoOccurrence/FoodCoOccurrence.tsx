"use client";

import { SectionCard } from "@/components/features/parent-mode";
import { Text } from "@/components/ui";
import type { FoodTermCount } from "@/lib/patterns";
import {
  FoodBody,
  FoodCountBadge,
  FoodList,
  FoodListItem,
  FoodName,
} from "./FoodCoOccurrence.style";

interface FoodCoOccurrenceProps {
  termCounts: FoodTermCount[];
}

export function FoodCoOccurrence({ termCounts }: FoodCoOccurrenceProps) {
  return (
    <SectionCard section="patterns" title="Logged Foods on Days with Discomfort">
      <FoodBody>
        <Text tone="muted">
          Foods recorded in the diary on days when discomfort was marked. These are shown as factual
          co-occurrence counts to discuss with your healthcare team, not as causes.
        </Text>

        {termCounts.length === 0 ? (
          <Text tone="muted">No food entries recorded on days with discomfort.</Text>
        ) : (
          <FoodList aria-label="Foods logged on days with discomfort">
            {termCounts.map((food) => (
              <FoodListItem key={food.term}>
                <FoodName>{food.term}</FoodName>
                <FoodCountBadge>
                  appeared on {food.days} {food.days === 1 ? "day" : "days"} with discomfort
                </FoodCountBadge>
              </FoodListItem>
            ))}
          </FoodList>
        )}
      </FoodBody>
    </SectionCard>
  );
}

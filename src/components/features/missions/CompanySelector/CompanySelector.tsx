"use client";

import { Heading, Stack, Text } from "@/components/ui";
import type { MissionCompany } from "@/types";
import {
  ButtonSubtitle,
  ButtonTitle,
  CompanyOptionGrid,
  LargeCompanyButton,
  SelectorContainer,
} from "./CompanySelector.style";

type CompanySelectorProps = {
  onSelect: (company: MissionCompany) => void;
};

export function CompanySelector({ onSelect }: CompanySelectorProps) {
  return (
    <SelectorContainer aria-label="Who is moving with you today">
      <Stack gap="xs" align="center">
        <Heading level={2}>Who is moving with you today?</Heading>
        <Text tone="muted">Choose how you want to do this mission.</Text>
      </Stack>

      <CompanyOptionGrid role="group" aria-label="Choose who is doing this mission with you">
        <LargeCompanyButton
          type="button"
          onClick={() => onSelect("alone")}
          aria-label="On my own: Just you and your companion"
        >
          <ButtonTitle>On my own</ButtonTitle>
          <ButtonSubtitle>Just you and your companion</ButtonSubtitle>
        </LargeCompanyButton>

        <LargeCompanyButton
          type="button"
          onClick={() => onSelect("family")}
          aria-label="With my family: Together with a parent or carer"
        >
          <ButtonTitle>With my family</ButtonTitle>
          <ButtonSubtitle>Together with a parent or carer</ButtonSubtitle>
        </LargeCompanyButton>

        <LargeCompanyButton
          type="button"
          onClick={() => onSelect("other")}
          aria-label="With someone else: Together with a sibling, friend, or relative"
        >
          <ButtonTitle>With someone else</ButtonTitle>
          <ButtonSubtitle>Together with a sibling, friend, or relative</ButtonSubtitle>
        </LargeCompanyButton>
      </CompanyOptionGrid>
    </SelectorContainer>
  );
}

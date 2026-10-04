import styled from "styled-components";
import type { ParentSection } from "../sections";

export const BannerContainer = styled.header<{ $section: ParentSection; $hasGear: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 56px;
  margin-right: ${({ theme, $hasGear }) =>
    $hasGear ? `calc(${theme.touchTarget} + ${theme.spacing.sm})` : "0"};
  padding: ${({ theme }) => `6px ${theme.spacing.md}`};
  background: ${({ theme, $section }) => theme.sections[$section].fill};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.leaf};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const BannerText = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

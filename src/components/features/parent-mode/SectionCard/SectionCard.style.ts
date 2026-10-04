import styled from "styled-components";
import type { ParentSection } from "../sections";

export const SectionCardContainer = styled.section`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const SectionCardHeader = styled.header<{ $section: ParentSection }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme, $section }) => theme.sections[$section].fill};
  border-bottom: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
`;

export const SectionCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
`;

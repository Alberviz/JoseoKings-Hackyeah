import styled from "styled-components";

export const FamilyLinkContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const KeyWarning = styled.aside`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  line-height: 1.5;
`;

export const SummaryList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
`;

export const SummaryTerm = styled.dt`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const SummaryValue = styled.dd`
  margin: 0;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  text-align: right;
`;

export const FactLine = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const CodeTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  resize: vertical;
  box-sizing: border-box;
`;

export const ActionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
`;

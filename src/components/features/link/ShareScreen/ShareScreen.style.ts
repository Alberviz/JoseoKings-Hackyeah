import styled from "styled-components";

export const ShareContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const StepList = styled.ol`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md};
`;

export const StepItem = styled.li`
  line-height: 1.5;
`;

export const LinkedBadge = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;

export const ActionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

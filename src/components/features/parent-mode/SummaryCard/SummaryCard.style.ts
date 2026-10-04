import styled from "styled-components";

export const SummaryContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  margin: 0 auto;
`;

export const FactList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const FactItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const AnswerValue = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.ink};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const AnswerLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.ink};
`;

export const DegreeFaceSvg = styled.svg`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

export const DegreeFaceCircle = styled.circle`
  fill: ${({ theme }) => theme.colors.textMuted};
`;

export const DegreeFaceEye = styled.circle`
  fill: ${({ theme }) => theme.colors.surface};
`;

export const DegreeFaceMouth = styled.path`
  stroke: ${({ theme }) => theme.colors.surface};
  stroke-width: 1.5;
  stroke-linecap: round;
  fill: none;
`;

export const MissionItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const MissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const PromptCard = styled.aside`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primarySoft};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

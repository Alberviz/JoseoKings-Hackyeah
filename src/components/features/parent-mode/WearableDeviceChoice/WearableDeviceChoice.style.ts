import styled from "styled-components";

export const ChoiceGroup = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

export const ChoiceLegend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

import styled from "styled-components";

export const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StatusMessage = styled.p<{ $isError: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme, $isError }) => ($isError ? theme.colors.urgent : theme.colors.textMuted)};
`;

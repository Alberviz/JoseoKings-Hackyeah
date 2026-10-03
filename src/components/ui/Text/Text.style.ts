import styled from "styled-components";

export type TextTone = "default" | "muted" | "urgent";
export type TextSize = "sm" | "md" | "lg";

export const StyledText = styled.p<{ $tone: TextTone; $size: TextSize }>`
  margin: 0;
  font-size: ${({ theme, $size }) => theme.fontSize[$size]};
  color: ${({ theme, $tone }) =>
    $tone === "muted"
      ? theme.colors.textMuted
      : $tone === "urgent"
        ? theme.colors.urgent
        : theme.colors.text};
`;

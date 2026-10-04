import styled from "styled-components";

export const DisplayContainer = styled.figure`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  width: 100%;
`;

export const CodeFrame = styled.div`
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const CodeImage = styled.img`
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;

export const Caption = styled.figcaption`
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

export const FrameControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  max-width: 320px;
`;

export const Dots = styled.ol`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Dot = styled.li<{ $isCurrent: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $isCurrent }) =>
    $isCurrent ? theme.colors.primary : theme.colors.border};
`;

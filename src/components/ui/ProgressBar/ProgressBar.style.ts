import styled from "styled-components";

export const Track = styled.div`
  width: 100%;
  height: 18px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.pill};
`;

// The width changes with the value, so it goes in attrs instead of creating a class per value.
export const Fill = styled.div.attrs<{ $percent: number }>(({ $percent }) => ({
  style: { width: `${$percent}%` },
}))`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.pill};
  transition: width 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

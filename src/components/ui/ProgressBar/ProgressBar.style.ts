import styled from "styled-components";

export const Track = styled.div`
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primarySoft};
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
`;

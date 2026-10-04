import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    transform: translateX(-120%);
  }
  60%,
  100% {
    transform: translateX(260%);
  }
`;

// White sticker box. It takes all the free width of the top row, so the track stretches.
export const MeterBox = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
  height: 44px;
  padding: 0 12px 0 8px;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.sm};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const FlameWrapper = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  & svg {
    width: 24px;
    height: 24px;
  }
`;

export const Track = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 40px;
  height: 14px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.paper};
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: 4px;
`;

export const Fill = styled.div.attrs<{ $percent: number }>(({ $percent }) => ({
  style: { width: `${$percent}%` },
}))`
  position: relative;
  height: 100%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 300ms ease;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 40%;
    background: linear-gradient(
      100deg,
      transparent 0%,
      ${({ theme }) => theme.colors.surface}99 50%,
      transparent 100%
    );
    animation: ${shimmer} 3.2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      animation: none;
      display: none;
    }
  }
`;

export const Value = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
  color: ${({ theme }) => theme.colors.ink};
`;

import Link from "next/link";
import styled, { keyframes } from "styled-components";

const pop = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(8px);
  }
  70% {
    opacity: 1;
    transform: scale(1.04) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const float = keyframes`
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const wiggle = keyframes`
  0%,
  100% {
    transform: rotate(0deg);
  }
  30% {
    transform: rotate(-8deg);
  }
  70% {
    transform: rotate(8deg);
  }
`;

// Pops in once, then floats a little. The animation sits here so the link can still press down.
export const BubbleFloat = styled.div`
  position: relative;
  z-index: 2;
  width: min(100%, 360px);
  margin-bottom: 14px;
  animation:
    ${pop} 450ms ease-out both,
    ${float} 3.6s ease-in-out 450ms infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const BubbleLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 56px;
  padding: 8px 12px;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;

  /* The tail points down at the dragon. */
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -11px;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    background: ${({ theme }) => theme.colors.surface};
    border-right: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
    border-bottom: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
    transform: rotate(45deg);
    border-bottom-right-radius: 4px;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};

    &::after {
      background-color: ${({ theme }) => theme.colors.primarySoft};
    }
  }

  &:active {
    transform: translate(2px, 3px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  &:hover svg,
  &:focus-visible svg {
    animation: ${wiggle} 500ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover svg,
    &:focus-visible svg {
      animation: none;
    }
  }
`;

export const BubbleText = styled.span`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
`;

export const BubbleTitle = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1.15;
`;

export const BubbleSubtitle = styled.span`
  font-size: 0.8125rem;
  line-height: 1.2;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const IconSlot = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

export const DoneChip = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  padding: 4px 12px 4px 6px;
  background: ${({ theme }) => theme.colors.successSoft};
  border: 1.5px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.success};
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
`;

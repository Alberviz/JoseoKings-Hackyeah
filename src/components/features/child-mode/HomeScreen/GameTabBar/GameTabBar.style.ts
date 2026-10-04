import Link from "next/link";
import styled, { keyframes } from "styled-components";

const wiggle = keyframes`
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-9deg) scale(1.06);
  }
  75% {
    transform: rotate(9deg) scale(1.06);
  }
`;

export const BarNav = styled.nav`
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidth} solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => `${theme.shadowPress} ${theme.colors.ink}`};
`;

export const BarList = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
  height: clamp(64px, 9dvh, 80px);
  margin: 0;
  padding: 5px;
  box-sizing: border-box;
  list-style: none;
`;

export const BarItem = styled.li`
  min-width: 0;
`;

export const BarLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 100%;
  min-height: ${({ theme }) => theme.touchTarget};
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:active {
    transform: scale(0.94) translateY(2px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -2px;
  }

  &:hover svg,
  &:focus-visible svg {
    animation: ${wiggle} 500ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:active {
      transform: none;
    }

    &:hover svg,
    &:focus-visible svg {
      animation: none;
    }
  }
`;

export const IconSlot = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: clamp(26px, 3.8dvh, 34px);
    height: clamp(26px, 3.8dvh, 34px);
  }
`;

export const BarLabel = styled.span`
  font-family: ${({ theme }) => theme.fontFamily.heading};
  font-size: clamp(0.8125rem, 2dvh, 0.9375rem);
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1.1;
`;

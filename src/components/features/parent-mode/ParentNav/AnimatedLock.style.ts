import styled, { css, keyframes } from "styled-components";

const lockBounce = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(0.9, 1.07); }
  70% { transform: scale(1.06, 0.95); }
  100% { transform: scale(1); }
`;

// Open padlock: the shackle floats up. Locking drops it, then the body gives a small bounce.
export const LockShackle = styled.g<{ $locking: boolean }>`
  transform: translateY(${({ $locking }) => ($locking ? "0" : "-6px")});
  transition: transform 260ms cubic-bezier(0.4, 0, 0.6, 1);
`;

export const LockBody = styled.g<{ $locking: boolean }>`
  transform-box: fill-box;
  transform-origin: center bottom;
  ${({ $locking }) =>
    $locking
      ? css`
          animation: ${lockBounce} 380ms 240ms ease-out;
        `
      : ""}
`;

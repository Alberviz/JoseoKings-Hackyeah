import styled, { css } from "styled-components";

export type HeadingLevel = 1 | 2 | 3;

const levelStyles = {
  1: css`
    font-size: ${({ theme }) => theme.fontSize.xxl};
  `,
  2: css`
    font-size: ${({ theme }) => theme.fontSize.xl};
  `,
  3: css`
    font-size: ${({ theme }) => theme.fontSize.lg};
  `,
};

export const StyledHeading = styled.h1<{ $level: HeadingLevel }>`
  margin: 0;
  line-height: 1.2;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  ${({ $level }) => levelStyles[$level]}
`;

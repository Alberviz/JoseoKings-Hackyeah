import styled from "styled-components";

export const ScreenContainer = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.maxContentWidth};
  min-height: 100dvh;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.md}`};
`;

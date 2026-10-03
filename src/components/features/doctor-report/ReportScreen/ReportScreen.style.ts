import styled from "styled-components";

export const NavigationBar = styled.nav`
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media print {
    display: none !important;
  }
`;

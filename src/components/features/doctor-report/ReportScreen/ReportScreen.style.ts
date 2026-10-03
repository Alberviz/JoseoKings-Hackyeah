import styled from "styled-components";

export const NavigationBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media print {
    display: none !important;
  }
`;

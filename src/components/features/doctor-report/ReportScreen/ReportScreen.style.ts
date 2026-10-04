import styled from "styled-components";

// The screen banner is not printed: the report has its own title, and the banner alone
// on the first page looked like a broken print.
export const BannerWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media print {
    display: none !important;
  }
`;

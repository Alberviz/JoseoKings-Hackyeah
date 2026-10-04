import styled from "styled-components";

// The report is printed: the banner keeps its text but loses the colour fill and the shadow.
export const BannerWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media print {
    header {
      background: none !important;
      box-shadow: none !important;
      margin-right: 0 !important;
    }
  }
`;

import styled from "styled-components";

export const ResultContainer = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  text-align: center;
`;

export const CompanionCheerBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
`;

export const ConfidenceBadgeBox = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const ResultActionNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

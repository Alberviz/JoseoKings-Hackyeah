import styled, { createGlobalStyle } from "styled-components";

export const PrintGlobalStyle = createGlobalStyle`
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    body {
      background: ${({ theme }) => theme.colors.surface} !important;
      color: ${({ theme }) => theme.colors.text} !important;
    }

    main {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      min-height: auto !important;
    }

    .no-print {
      display: none !important;
    }

    /* Ensure everything fits compactly and avoid unwanted page breaks */
    section, table, tr, figure, article, aside {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

export const ReportContainer = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  color: ${({ theme }) => theme.colors.text};

  @media print {
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    background: ${({ theme }) => theme.colors.surface} !important;
    box-shadow: none !important;
    gap: 10px !important;
    font-size: 9.5pt !important;
  }
`;

export const ReportHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primarySoft};
  padding-bottom: ${({ theme }) => theme.spacing.md};

  @media print {
    border-bottom: 1.5px solid ${({ theme }) => theme.colors.text} !important;
    padding-bottom: 6px !important;
    gap: 3px !important;
  }
`;

export const HeaderTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;

  @media print {
    flex-wrap: nowrap !important;
  }
`;

export const HeaderTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ReportTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;

  @media print {
    font-size: 15pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const HeaderMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  @media print {
    font-size: 8.5pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
    gap: 10px !important;
  }
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const StrongText = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  @media print {
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const DemoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.urgent};
  color: ${({ theme }) => theme.colors.onUrgent};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.02em;

  @media print {
    border: 1px solid ${({ theme }) => theme.colors.text} !important;
    color: ${({ theme }) => theme.colors.text} !important;
    background: ${({ theme }) => theme.colors.background} !important;
    font-size: 7.5pt !important;
    padding: 1px 6px !important;
  }
`;

export const ScreenOnly = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  @media print {
    display: none !important;
  }
`;

export const ReportSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  break-inside: avoid;
  page-break-inside: avoid;

  @media print {
    gap: 4px !important;
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media print {
    font-size: 11pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
    margin-bottom: 2px !important;
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media print {
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 6px !important;
  }
`;

export const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  gap: 4px;

  @media print {
    padding: 4px 6px !important;
    background: ${({ theme }) => theme.colors.surface} !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    border-radius: 4px !important;
    gap: 2px !important;
  }
`;

export const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeight.medium};

  @media print {
    font-size: 7.5pt !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
  }
`;

export const StatValue = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1.1;

  @media print {
    font-size: 12pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const StatDetail = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};

  @media print {
    font-size: 7pt !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
  }
`;

export const ActivityOverview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  @media print {
    gap: 4px !important;
  }
`;

export const TotalMissionsBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSize.md};
  color: ${({ theme }) => theme.colors.text};

  @media print {
    font-size: 9pt !important;
  }
`;

export const TotalMissionsHighlight = styled.strong`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  @media print {
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const ActivityConfidenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media print {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 6px !important;
  }
`;

export const ActivityConfidenceCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  gap: 2px;

  @media print {
    padding: 4px 6px !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    border-radius: 4px !important;
    gap: 1px !important;
    background: ${({ theme }) => theme.colors.surface} !important;
  }
`;

export const ActivityConfidenceLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};

  @media print {
    font-size: 8pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const ActivityConfidenceCount = styled.span`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};

  @media print {
    font-size: 10pt !important;
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};

  @media print {
    overflow-x: visible !important;
    border: none !important;
    border-radius: 0 !important;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSize.sm};
  text-align: left;

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.background};
  }

  @media print {
    font-size: 8pt !important;

    tbody tr:nth-child(even) {
      background: ${({ theme }) => theme.colors.background} !important;
    }
  }
`;

export const TableHead = styled.thead`
  background: ${({ theme }) => theme.colors.primarySoft};

  @media print {
    background: ${({ theme }) => theme.colors.primarySoft} !important;
  }
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  @media print {
    break-inside: avoid;
    page-break-inside: avoid;
  }
`;

export const TableHeaderCell = styled.th`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  white-space: nowrap;

  @media print {
    padding: 2px 4px !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    color: ${({ theme }) => theme.colors.text} !important;
    font-weight: 700 !important;
  }
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media print {
    padding: 2px 4px !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    color: ${({ theme }) => theme.colors.text} !important;
  }
`;

export const TableEmptyCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  @media print {
    padding: 6px !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
  }
`;

export const SectionNote = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: 1.4;

  @media print {
    font-size: 7.5pt !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
  }
`;

export const DisclaimerBanner = styled.aside`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primarySoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 4px;
  break-inside: avoid;
  page-break-inside: avoid;

  @media print {
    background: ${({ theme }) => theme.colors.background} !important;
    border: 1px solid ${({ theme }) => theme.colors.border} !important;
    border-radius: 4px !important;
    padding: 6px 8px !important;
    gap: 2px !important;
  }
`;

export const DisclaimerTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};

  @media print {
    color: ${({ theme }) => theme.colors.text} !important;
    font-size: 8pt !important;
  }
`;

export const DisclaimerText = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: 1.4;

  @media print {
    color: ${({ theme }) => theme.colors.text} !important;
    font-size: 7.5pt !important;
    line-height: 1.25 !important;
  }
`;

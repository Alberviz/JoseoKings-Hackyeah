import styled from "styled-components";

export const ScannerContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const ModeTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ModeTab = styled.button<{ $isActive: boolean }>`
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px solid
    ${({ theme, $isActive }) => ($isActive ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primarySoft : theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Viewfinder = styled.div`
  position: relative;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
  margin: 0 auto;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.text};
`;

export const CameraVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const HiddenCanvas = styled.canvas`
  display: none;
`;

export const ViewfinderGuide = styled.div`
  position: absolute;
  inset: 12%;
  border: 3px solid ${({ theme }) => theme.colors.focus};
  border-radius: ${({ theme }) => theme.radius.md};
  pointer-events: none;
`;

export const StatusLine = styled.p<{ $tone: "default" | "success" | "urgent" }>`
  margin: 0;
  min-height: 1.5em;
  font-size: ${({ theme }) => theme.fontSize.md};
  color: ${({ theme, $tone }) =>
    $tone === "success"
      ? theme.colors.success
      : $tone === "urgent"
        ? theme.colors.urgent
        : theme.colors.textMuted};
`;

export const FileLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${({ theme }) => theme.touchTarget};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  cursor: pointer;

  &:focus-within {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
`;

export const PasteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

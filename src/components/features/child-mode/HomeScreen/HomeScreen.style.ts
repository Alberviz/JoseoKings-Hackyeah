import Link from "next/link";
import styled from "styled-components";

export const HomeScreenRoot = styled.main`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px) 16px;
  background-color: ${({ theme }) => theme.colors.childHomeBg};
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  position: relative;
`;

export const TopBar = styled.header`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  max-width: 440px;
  min-height: 40px;
`;

export const ParentDoorLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    background-color: rgba(255, 255, 255, 0.8);
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const CenterFocusArea = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  max-width: 440px;
  margin: auto 0;
`;

export const DragonAnchor = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const PlayButton = styled.button`
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.playButton};
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(112, 84, 199, 0.35);
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease;
  z-index: 10;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    transform: translateX(-50%) scale(1.06);
    box-shadow: 0 10px 28px rgba(112, 84, 199, 0.45);
  }

  &:active {
    transform: translateX(-50%) scale(0.94);
    box-shadow: 0 4px 12px rgba(112, 84, 199, 0.3);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.dragonEye};
    outline-offset: 3px;
  }
`;

export const PlayTriangleSvg = styled.svg`
  width: 26px;
  height: 26px;
  display: block;
  margin-left: 4px;
`;

export const BottomNavArea = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 380px;
  padding: 10px 18px;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 36px;
  box-sizing: border-box;
  margin-top: auto;
  margin-bottom: 8px;
  z-index: 5;
`;

export const NavLink = styled(Link)<{ $isActive?: boolean }>`
  background: none;
  border: none;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 18px;
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.playButton : theme.colors.dragonEye};
  transition:
    color 0.18s ease,
    transform 0.18s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.playButton};
    outline-offset: 2px;
  }
`;

export const NavIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

export const NavSvg = styled.svg`
  width: 22px;
  height: 22px;
  display: block;
`;

export const SvgPolygon = styled.polygon``;
export const SvgPath = styled.path``;
export const SvgCircle = styled.circle``;

export const NavLabel = styled.span`
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1;
  text-transform: uppercase;
  color: inherit;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.childHomeBg};
`;

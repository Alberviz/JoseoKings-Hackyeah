"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import type { ParentSection } from "../sections";
import { AnimatedLock } from "./AnimatedLock";
import {
  ExitButton,
  ExitInner,
  ExitPanel,
  ExitTileButton,
  ExitTileLink,
  NavBar,
  NavItem,
  NavList,
  NavSpacer,
  SettingsLink,
  TabLink,
} from "./ParentNav.style";
import { ParentNavIcon, type ParentNavIconKey } from "./ParentNavIcons";

const TABS: { href: string; label: string; icon: ParentNavIconKey; section: ParentSection }[] = [
  { href: ROUTES.parent, label: "Summary", icon: "summary", section: "summary" },
  { href: ROUTES.parentLog, label: "Log", icon: "log", section: "log" },
  { href: ROUTES.parentFoods, label: "Food", icon: "food", section: "food" },
  { href: ROUTES.parentPatterns, label: "Patterns", icon: "patterns", section: "patterns" },
  { href: ROUTES.parentReport, label: "Report", icon: "report", section: "more" },
];

// How long the padlock animation plays before the session really locks.
const LOCK_ANIMATION_MS = 650;

export function ParentNav() {
  const pathname = usePathname();
  const session = useParentSession();
  const { state } = useAppState();
  // The sheet belongs to the route it was opened on, so navigating closes it.
  const [exitOpenPath, setExitOpenPath] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const lockTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(lockTimer.current), []);

  const isParentOnly = state.settings?.deviceRole === "parent";
  const isHidden = !session.isUnlocked || pathname === ROUTES.parentSetup;
  const isExitOpen = exitOpenPath === pathname;

  if (isHidden) {
    return null;
  }

  const handleLock = () => {
    if (isLocking) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      session.lock();
      return;
    }
    setIsLocking(true);
    lockTimer.current = window.setTimeout(() => {
      setIsLocking(false);
      setExitOpenPath(null);
      session.lock();
    }, LOCK_ANIMATION_MS);
  };

  return (
    <>
      {pathname === ROUTES.parentSettings ? null : (
        <SettingsLink href={ROUTES.parentSettings} aria-label="Settings">
          <ParentNavIcon iconKey="settings" size={30} />
        </SettingsLink>
      )}
      <ExitButton
        type="button"
        aria-label="Exit parent mode"
        aria-expanded={isExitOpen}
        onClick={() => setExitOpenPath(isExitOpen ? null : pathname)}
      >
        <ParentNavIcon iconKey="exit" size={30} />
      </ExitButton>
      <NavSpacer />
      {isExitOpen ? (
        <ExitPanel>
          <ExitInner role="group" aria-label="Leave parent mode">
            <ExitTileButton type="button" $fill="patterns" onClick={handleLock}>
              <AnimatedLock locking={isLocking} size={44} />
              {isLocking ? "Locked" : "Lock"}
            </ExitTileButton>
            {isParentOnly ? null : (
              <ExitTileLink href={ROUTES.home} $fill="summary">
                <ParentNavIcon iconKey="child" size={44} />
                Back to child mode
              </ExitTileLink>
            )}
          </ExitInner>
        </ExitPanel>
      ) : null}
      <NavBar aria-label="Parent sections">
        <NavList>
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <NavItem key={tab.href}>
                <TabLink
                  href={tab.href}
                  $isActive={isActive}
                  $section={tab.section}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setExitOpenPath(null)}
                >
                  <ParentNavIcon iconKey={tab.icon} />
                  {tab.label}
                </TabLink>
              </NavItem>
            );
          })}
        </NavList>
      </NavBar>
    </>
  );
}

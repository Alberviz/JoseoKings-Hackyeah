"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import {
  MoreInner,
  MorePanel,
  MoreTileButton,
  MoreTileLink,
  NavBar,
  NavItem,
  NavList,
  NavSpacer,
  SettingsLink,
  TabButton,
  TabLink,
} from "./ParentNav.style";
import type { ParentSection } from "../sections";
import { ParentNavIcon, type ParentNavIconKey } from "./ParentNavIcons";

const TABS: { href: string; label: string; icon: ParentNavIconKey; section: ParentSection }[] = [
  { href: ROUTES.parent, label: "Summary", icon: "summary", section: "summary" },
  { href: ROUTES.parentLog, label: "Log", icon: "log", section: "log" },
  { href: ROUTES.parentFoods, label: "Food", icon: "food", section: "food" },
  { href: ROUTES.parentPatterns, label: "Patterns", icon: "patterns", section: "patterns" },
];

const MORE_ROUTES: string[] = [ROUTES.parentReport, ROUTES.parentLink];

export function ParentNav() {
  const pathname = usePathname();
  const session = useParentSession();
  const { state } = useAppState();
  // The panel belongs to the route it was opened on, so navigating closes it.
  const [moreOpenPath, setMoreOpenPath] = useState<string | null>(null);
  const isMoreOpen = moreOpenPath === pathname;

  const isParentOnly = state.settings?.deviceRole === "parent";
  const isHidden = !session.isUnlocked || pathname === ROUTES.parentSetup;

  if (isHidden) {
    return null;
  }

  const isMoreActive = MORE_ROUTES.includes(pathname) || isMoreOpen;

  return (
    <>
      {pathname === ROUTES.parentSettings ? null : (
        <SettingsLink href={ROUTES.parentSettings} aria-label="Settings">
          <ParentNavIcon iconKey="settings" size={30} />
        </SettingsLink>
      )}
      <NavSpacer />
      {isMoreOpen ? (
        <MorePanel>
          <MoreInner>
            <MoreTileLink href={ROUTES.parentReport} $fill="more">
              <ParentNavIcon iconKey="report" size={36} />
              Doctor report
            </MoreTileLink>
            <MoreTileLink href={ROUTES.parentLink} $fill="patterns">
              <ParentNavIcon iconKey="link" size={36} />
              Family link
            </MoreTileLink>
            <MoreTileButton type="button" $fill="surface" onClick={session.lock}>
              <ParentNavIcon iconKey="lock" size={36} />
              Lock
            </MoreTileButton>
            {isParentOnly ? null : (
              <MoreTileLink href={ROUTES.home} $fill="summary">
                <ParentNavIcon iconKey="child" size={36} />
                Back to child mode
              </MoreTileLink>
            )}
          </MoreInner>
        </MorePanel>
      ) : null}
      <NavBar aria-label="Parent sections">
        <NavList>
          {TABS.map((tab) => {
            const isActive = pathname === tab.href && !isMoreOpen;
            return (
              <NavItem key={tab.href}>
                <TabLink
                  href={tab.href}
                  $isActive={isActive}
                  $section={tab.section}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMoreOpenPath(null)}
                >
                  <ParentNavIcon iconKey={tab.icon} />
                  {tab.label}
                </TabLink>
              </NavItem>
            );
          })}
          <NavItem>
            <TabButton
              type="button"
              $isActive={isMoreActive}
              $section="more"
              aria-expanded={isMoreOpen}
              onClick={() => setMoreOpenPath(isMoreOpen ? null : pathname)}
            >
              <ParentNavIcon iconKey="more" />
              More
            </TabButton>
          </NavItem>
        </NavList>
      </NavBar>
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import {
  MoreInner,
  MorePanel,
  NavBar,
  NavItem,
  NavList,
  NavSpacer,
  TabButton,
  TabIcon,
  TabLink,
} from "./ParentNav.style";

const TABS = [
  { href: ROUTES.parent, label: "Summary", icon: "🏠" },
  { href: ROUTES.parentLog, label: "Log", icon: "📝" },
  { href: ROUTES.parentFoods, label: "Food", icon: "🍽️" },
  { href: ROUTES.parentPatterns, label: "Patterns", icon: "📈" },
] as const;

const MORE_ROUTES: string[] = [ROUTES.parentReport, ROUTES.parentSettings, ROUTES.parentLink];

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
      <NavSpacer />
      {isMoreOpen ? (
        <MorePanel>
          <MoreInner>
            <LinkButton href={ROUTES.parentReport} variant="secondary" fullWidth>
              Doctor report
            </LinkButton>
            <LinkButton href={ROUTES.parentSettings} variant="secondary" fullWidth>
              Settings
            </LinkButton>
            <LinkButton href={ROUTES.parentLink} variant="secondary" fullWidth>
              Family link
            </LinkButton>
            <Button variant="secondary" fullWidth onClick={session.lock}>
              Lock
            </Button>
            {isParentOnly ? null : (
              <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
                Back to child mode
              </LinkButton>
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
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMoreOpenPath(null)}
                >
                  <TabIcon aria-hidden="true">{tab.icon}</TabIcon>
                  {tab.label}
                </TabLink>
              </NavItem>
            );
          })}
          <NavItem>
            <TabButton
              type="button"
              $isActive={isMoreActive}
              aria-expanded={isMoreOpen}
              onClick={() => setMoreOpenPath(isMoreOpen ? null : pathname)}
            >
              <TabIcon aria-hidden="true">⋯</TabIcon>
              More
            </TabButton>
          </NavItem>
        </NavList>
      </NavBar>
    </>
  );
}

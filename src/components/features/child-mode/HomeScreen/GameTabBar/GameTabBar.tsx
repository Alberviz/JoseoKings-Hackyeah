"use client";

import { ROUTES } from "@/config/app";
import { HomeIcon, type HomeIconKey } from "../HomeIcons";
import { BarItem, BarLabel, BarLink, BarList, BarNav, IconSlot } from "./GameTabBar.style";

type GameTab = {
  label: string;
  href: string;
  testId: string;
  iconKey: HomeIconKey;
};

const GAME_TABS: GameTab[] = [
  { label: "Shop", href: ROUTES.shop, testId: "nav-shop", iconKey: "shop" },
  { label: "Food", href: ROUTES.food, testId: "nav-food", iconKey: "food" },
  { label: "Dress up", href: ROUTES.customize, testId: "nav-customize", iconKey: "dress" },
];

// One joined bar with the three game places: Shop, Food and Dress up.
export function GameTabBar() {
  return (
    <BarNav aria-label="Game">
      <BarList>
        {GAME_TABS.map((tab) => (
          <BarItem key={tab.testId}>
            <BarLink href={tab.href} data-testid={tab.testId}>
              <IconSlot>
                <HomeIcon iconKey={tab.iconKey} />
              </IconSlot>
              <BarLabel>{tab.label}</BarLabel>
            </BarLink>
          </BarItem>
        ))}
      </BarList>
    </BarNav>
  );
}

"use client";

import type { ReactNode } from "react";
import { CardContainer } from "./Card.style";

type CardProps = {
  children: ReactNode;
  label?: string;
};

export function Card({ children, label }: CardProps) {
  return <CardContainer aria-label={label}>{children}</CardContainer>;
}

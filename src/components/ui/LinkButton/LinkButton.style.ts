import Link from "next/link";
import styled from "styled-components";
import { buttonBase, type ButtonVariant } from "../Button/Button.style";

export const StyledLinkButton = styled(Link)<{ $variant: ButtonVariant; $fullWidth: boolean }>`
  ${buttonBase}
`;

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* Set on every element: some browsers do not inherit it into buttons, links and form controls. */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  button,
  a,
  label,
  summary,
  [role="button"] {
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  button:focus:not(:focus-visible),
  a:focus:not(:focus-visible) {
    outline: none;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  /* Notebook paper: a very light 24px grid drawn with two linear gradients. */
  body {
    background-color: ${({ theme }) => theme.colors.paper};
    background-image:
      linear-gradient(${({ theme }) => theme.colors.paperGrid} 1px, transparent 1px),
      linear-gradient(90deg, ${({ theme }) => theme.colors.paperGrid} 1px, transparent 1px);
    background-size: 24px 24px;
    color: ${({ theme }) => theme.colors.ink};
    font-family: ${({ theme }) => theme.fontFamily.body};
    font-size: ${({ theme }) => theme.fontSize.md};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media print {
    body {
      background: #fff;
      background-image: none;
    }

    *,
    *::before,
    *::after {
      box-shadow: none !important;
      text-shadow: none !important;
    }
  }
`;

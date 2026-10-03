import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

// Project rule: .tsx files compose React components only.
// Raw HTML tags, inline styles and class names belong in the sibling .style.ts file (styled-components).
const componentOnlyRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "JSXOpeningElement > JSXIdentifier[name=/^[a-z]/]",
      message:
        "No raw HTML tags in .tsx files. Create a styled component in the sibling .style.ts file and use it here.",
    },
    {
      selector: "JSXAttribute[name.name='style']",
      message: "No inline styles. Move the styles to the sibling .style.ts file.",
    },
    {
      selector: "JSXAttribute[name.name='className']",
      message: "No className. Use a styled component from the sibling .style.ts file.",
    },
  ],
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["*.css", "*.scss"],
          message: "No CSS files. Use styled-components in a .style.ts file.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/**/*.tsx"],
    // The root layout must render <html> and <body>.
    ignores: ["src/app/layout.tsx"],
    rules: componentOnlyRules,
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/**"]),
]);

export default eslintConfig;

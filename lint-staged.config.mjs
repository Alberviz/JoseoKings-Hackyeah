// The "prelint" step: runs on every commit, only over staged files.
const lintStagedConfig = {
  "*.{ts,tsx,mts,mjs}": ["eslint --max-warnings=0 --fix", "prettier --write"],
  "*.{ts,tsx}": () => "pnpm typecheck",
  "*.{json,md,yml,yaml,css}": "prettier --write",
};

export default lintStagedConfig;

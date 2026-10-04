import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not let `next dev` re-create AGENTS.md / CLAUDE.md in the repo.
  agentRules: false,
  compiler: {
    styledComponents: true,
  },
};

export default withSerwist(nextConfig);

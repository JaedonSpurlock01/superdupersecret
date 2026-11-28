import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Posts open in a dialog on the home page now; old links land there.
  async redirects() {
    return [
      { source: "/blogs", destination: "/#writings", permanent: true },
      { source: "/blogs/:slug", destination: "/?post=:slug", permanent: true },
      // Spurlock Labs has its own site now.
      {
        source: "/spurlock-labs/:path*",
        destination: "https://spurlocklabs.com",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);

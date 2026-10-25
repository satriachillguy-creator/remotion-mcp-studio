/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/sse",
        destination: "/api/mcp",
      },
      {
        source: "/mcp",
        destination: "/api/mcp",
      },
      {
        source: "/messages",
        destination: "/api/mcp",
      },
    ];
  },
};

export default nextConfig;

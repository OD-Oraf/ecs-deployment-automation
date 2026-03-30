/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:8080"}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${process.env.API_URL || "http://localhost:8080"}/health`,
      },
    ];
  },
};

export default nextConfig;

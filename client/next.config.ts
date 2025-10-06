import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/api/file/v1/thumb/**",
      },
    ],
  },
  allowedDevOrigins:["http://172.16.39.191:3000",
      "http://localhost:3000"],
  
};
// module.exports = {
//   allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
// }

export default nextConfig;

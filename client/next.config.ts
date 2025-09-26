import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins:["http://172.16.39.191:3000",
      "http://localhost:3000"],
  
};
// module.exports = {
//   allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
// }

export default nextConfig;

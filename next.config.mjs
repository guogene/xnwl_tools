/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    POCKETBASE_URL: process.env.POCKETBASE_URL,
    // 其他需要在客户端使用的环境变量
  }
};

export default nextConfig;

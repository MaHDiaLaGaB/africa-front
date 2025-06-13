// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // يساعد على كشف المشاكل بشكل مبكر

  images: {
    domains: ['your-domain.com', 'cdn.yourapp.com'], // ✨ إن احتجت تحميل صور من الخارج
  },

  eslint: {
    ignoreDuringBuilds: true, // يمنع فشل البناء بسبب تحذيرات ESLint
  },

  typescript: {
    ignoreBuildErrors: false, // يمكنك جعله true مؤقتًا أثناء التطوير
  },

  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },

  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/auth/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

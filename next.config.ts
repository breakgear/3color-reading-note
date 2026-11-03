import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // このアプリはログインした本人のデータだけを毎回表示するので、
  // ページの事前キャッシュ（cacheComponents）は使わない
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // 画像は直接Supabaseに送るので、フォームは小さくてよい
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

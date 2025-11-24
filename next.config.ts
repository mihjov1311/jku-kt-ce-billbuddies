import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ✅ RICHTIG (Neue Schreibweise für Next.js 15+)
    // Direkt auf der obersten Ebene, und der Name ist kürzer:
    serverExternalPackages: ["tesseract.js"],

};

export default nextConfig;
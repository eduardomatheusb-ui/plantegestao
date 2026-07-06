/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // Upload de anexos vai até 4 MB; o padrão de server action é 1 MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Garante que o guia (lido em runtime pela página /ajuda) vá no bundle.
  outputFileTracingIncludes: {
    "/ajuda": ["./docs/GUIA-TREM.md"],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // Upload de anexos vai até 4 MB; o padrão de server action é 1 MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Garante que arquivos lidos em runtime vão no bundle serverless do Netlify.
  outputFileTracingIncludes: {
    "/ajuda": ["./docs/GUIA-TREM.md"],
  },
};

export default nextConfig;

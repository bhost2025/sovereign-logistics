import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default withNextIntl(nextConfig);

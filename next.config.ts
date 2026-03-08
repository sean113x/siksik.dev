import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import postgres from 'postgres';

export const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'allow'
});

const nextConfig: NextConfig = {
  pageExtensions: ['md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    if (!process.env.POSTGRES_URL) {
      return [];
    }

    let redirects = await sql`
      SELECT source, destination, permanent
      FROM redirects;
    `;

    return redirects.map(({ source, destination, permanent }) => ({
      source,
      destination,
      permanent: !!permanent
    }));
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ['remark-frontmatter', ['remark-mdx-frontmatter', { name: 'metadata' }]],
  },
});

export default withMDX(nextConfig);

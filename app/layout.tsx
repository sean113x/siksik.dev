import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { promises as fs } from 'fs';
import path from 'path';
import ArticleShell from './article-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://next-mdx-blog.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'siksik',
    template: '%s | siksik',
  },
  description: 'My portfolio, blog, and personal website.',
};

type PostMeta = {
  title: string;
  date: string;
};

async function getPublicPostMeta(): Promise<Record<string, PostMeta>> {
  const postsDir = path.join(process.cwd(), 'app', 'public');
  const entries = await fs.readdir(postsDir, {
    recursive: true,
    withFileTypes: true,
  });

  const pages = entries.filter(
    (entry) =>
      entry.isFile() && (entry.name === 'page.md' || entry.name === 'page.mdx'),
  );

  const result: Record<string, PostMeta> = {};

  for (const entry of pages) {
    const filePath = path.join(entry.parentPath, entry.name);
    const source = await fs.readFile(filePath, 'utf8');
    const match = source.match(/^-{3}\n([\s\S]*?)\n-{3}/);
    if (!match) continue;

    const title = match[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
    const date = match[1]
      .match(/^date:\s*(.+)$/m)?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, '');

    if (!title || !date) continue;

    const slug = path
      .dirname(path.relative(postsDir, filePath))
      .replace(/\\/g, '/');
    result[`/public/${slug}`] = { title, date };
  }

  return result;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getPublicPostMeta();

  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} font-sans antialiased tracking-tight`}
      >
        <div className="min-h-screen flex flex-col justify-between pt-8 md:pt-25 p-8 dark:bg-neutral-900 bg-white text-gray-900 dark:text-white">
          <main className="max-w-[60ch] mx-auto w-full space-y-6">
            <ArticleShell posts={posts}>{children}</ArticleShell>
          </main>
          <Footer />
          <Analytics />
        </div>
      </body>
    </html>
  );
}

function Footer() {
  const links = [
    { name: 'github', url: 'https://github.com/sean113x' },
    { name: 'sean113x@unist.ac.kr', url: 'mailto:sean113x@unist.ac.kr' },
  ];

  return (
    <footer className="mt-12 text-center">
      <div className="flex justify-center space-x-4 tracking-tight">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors duration-200"
          >
            {link.name}
          </a>
        ))}
      </div>
    </footer>
  );
}

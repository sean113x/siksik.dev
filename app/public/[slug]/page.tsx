import { promises as fs } from 'fs';
import type { Dirent } from 'fs';
import type { Metadata } from 'next';
import path from 'path';
import { notFound } from 'next/navigation';

type Params = {
  slug: string;
};

async function getAvailableSlugs() {
  const postsDir = path.join(process.cwd(), 'public');
  let entries: Dirent[];

  try {
    entries = await fs.readdir(postsDir, { withFileTypes: true });
  } catch {
    return [] as string[];
  }

  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const checks = await Promise.all(
    dirs.map(async (slug) => {
      for (const ext of ['md', 'mdx']) {
        try {
          await fs.access(path.join(postsDir, slug, `page.${ext}`));
          return slug;
        } catch {
          continue;
        }
      }
      return null;
    }),
  );

  return checks.filter((slug): slug is string => slug !== null);
}

async function getPostExtension(slug: string) {
  const postsDir = path.join(process.cwd(), 'public');

  for (const ext of ['md', 'mdx'] as const) {
    try {
      await fs.access(path.join(postsDir, slug, `page.${ext}`));
      return ext;
    } catch {
      continue;
    }
  }

  return null;
}

function isValidSlug(slug: string) {
  return /^[a-zA-Z0-9-]+$/.test(slug);
}

async function getPostTitle(slug: string, extension: 'md' | 'mdx') {
  const post = await import(`../../../public/${slug}/page.${extension}`);
  const metadata = (post as { metadata?: { title?: string } }).metadata;

  if (metadata?.title) {
    return metadata.title;
  }

  const source = await fs.readFile(
    path.join(process.cwd(), 'public', slug, `page.${extension}`),
    'utf8',
  );
  const match = source.match(/^-{3}\n([\s\S]*?)\n-{3}/);
  if (!match) return null;

  return match[1].match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? null;
}

export async function generateStaticParams() {
  const slugs = await getAvailableSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return {};

  const extension = await getPostExtension(slug);
  if (!extension) return {};

  const title = await getPostTitle(slug, extension);
  return title ? { title } : {};
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    notFound();
  }

  const extension = await getPostExtension(slug);
  if (!extension) {
    notFound();
  }

  const post = await import(`../../../public/${slug}/page.${extension}`);

  if (!post?.default) {
    notFound();
  }

  const Content = post.default;
  return <Content />;
}

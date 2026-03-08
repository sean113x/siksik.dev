import { promises as fs } from 'fs';
import type { Dirent } from 'fs';
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

export async function generateStaticParams() {
  const slugs = await getAvailableSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
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

import { promises as fs } from 'fs';
import type { Dirent } from 'fs';
import path from 'path';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://next-mdx-blog.vercel.app';

async function getNoteSlugs(dir: string) {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const slugs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        for (const ext of ['md', 'mdx']) {
          try {
            await fs.access(path.join(dir, entry.name, `page.${ext}`));
            return entry.name;
          } catch {
            continue;
          }
        }
        return null;
      }),
  );

  return slugs.filter((slug): slug is string => slug !== null);
}

export default async function sitemap() {
  const notesDirectory = path.join(process.cwd(), 'public');
  const slugs = await getNoteSlugs(notesDirectory);

  const notes = slugs.map((slug) => ({
    url: `${SITE_URL}/public/${slug}`,
    lastModified: new Date().toISOString()
  }));

  const routes = ['', '/work'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString()
  }));

  return [...routes, ...notes];
}

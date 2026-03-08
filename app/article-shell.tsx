'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

type PostMeta = {
  title: string;
  date: string;
};

type Props = {
  children: ReactNode;
  posts: Record<string, PostMeta>;
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export default function ArticleShell({ children, posts }: Props) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const meta = posts[pathname];
  const linkClassName =
    'text-blue-500 hover:text-blue-700 dark:text-gray-400 hover:dark:text-gray-300 dark:underline dark:underline-offset-2 dark:decoration-gray-800';

  useEffect(() => {
    if (!meta || !contentRef.current) return;

    const root = contentRef.current;
    const firstH1 = root.querySelector('h1');
    if (firstH1 && firstH1.textContent?.trim() === meta.title) {
      firstH1.setAttribute('style', 'display:none');
    }

    const firstP = root.querySelector('p');
    const firstPText = firstP?.textContent ?? '';
    if (
      firstP &&
      firstPText.includes('by Seongsik') &&
      firstPText.includes('·')
    ) {
      firstP.setAttribute('style', 'display:none');
    }

    return () => {
      if (firstH1?.getAttribute('style') === 'display:none') {
        firstH1.removeAttribute('style');
      }
      if (firstP?.getAttribute('style') === 'display:none') {
        firstP.removeAttribute('style');
      }
    };
  }, [meta, pathname]);

  if (!meta) {
    return <>{children}</>;
  }

  return (
    <>
      <h1 className="font-bold text-3xl mt-7 mb-0 text-gray-800 dark:text-neutral-100">
        {meta.title}
      </h1>
      <p className="my-0 text-gray-800 dark:text-neutral-200 leading-[1.8]">
        <Link href="/" className={linkClassName}>
          by Seongsik
        </Link>{' '}
        · {formatDate(meta.date)}
      </p>
      <div ref={contentRef}>{children}</div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';

import type { RelatedContentItem } from '@/lib/ai/schemas';

interface RelatedContentCardsProps {
  blogSlug?: string;
  items?: RelatedContentItem[];
  pathname?: string;
  title?: string;
  variant?: 'assistant' | 'page';
}

function isRelatedContentResponse(
  value: unknown
): value is { relatedContent: RelatedContentItem[] } {
  if (typeof value !== 'object' || value === null || !('relatedContent' in value)) {
    return false;
  }

  return Array.isArray(value.relatedContent);
}

export default function RelatedContentCards({
  blogSlug,
  items,
  pathname,
  title = 'Related content',
  variant = 'assistant'
}: RelatedContentCardsProps) {
  const [fetchedItems, setFetchedItems] = useState<RelatedContentItem[]>(items ?? []);

  useEffect(() => {
    if (items !== undefined || (!blogSlug && !pathname)) {
      return;
    }

    let isMounted = true;

    void fetch(
      `/api/ai/related?${new URLSearchParams({
        ...(blogSlug ? { blogSlug } : {}),
        ...(pathname ? { pathname } : {})
      }).toString()}`
    )
      .then(async (response) => {
        if (!response.ok) {
          return { relatedContent: [] };
        }

        const payload: unknown = await response.json();
        return isRelatedContentResponse(payload) ? payload : { relatedContent: [] };
      })
      .then((result) => {
        if (isMounted) {
          setFetchedItems(result.relatedContent);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [blogSlug, items, pathname]);

  const contentItems = items ?? fetchedItems;

  if (contentItems.length === 0) {
    return null;
  }

  return (
    <section
      className={
        variant === 'page'
          ? 'mt-10 rounded-2xl border border-border bg-surface/75 p-5'
          : 'mt-3 rounded-2xl border border-border bg-background/60 p-3'
      }
    >
      <p className='mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted'>
        {title}
      </p>
      <div className='grid gap-3 md:grid-cols-2'>
        {contentItems.map((item) => (
          <a
            key={`${item.url}-${item.title}`}
            href={item.url}
            className='rounded-xl border border-border/80 bg-surface/80 px-4 py-3 transition hover:border-primary/40'
          >
            <span className='block text-xs uppercase tracking-[0.18em] text-primary'>
              {item.contentType}
            </span>
            <span className='mt-1 block font-medium text-text-primary'>{item.title}</span>
            <span className='mt-2 block text-sm text-text-secondary'>{item.reason}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

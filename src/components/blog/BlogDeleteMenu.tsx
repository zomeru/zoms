'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';

import { getClientErrorMessage, getResponseErrorMessage } from '@/lib/errorMessages';

import { useBlogAdminAuthorization } from './useBlogAdminAuthorization';

interface BlogDeleteMenuProps {
  initialAuthorized?: boolean;
  onDeleted?: () => void;
  redirectTo?: string;
  refreshOnDelete?: boolean;
  slug: string;
  title: string;
}

export function BlogDeleteMenu({
  initialAuthorized = false,
  onDeleted,
  redirectTo,
  refreshOnDelete = true,
  slug,
  title
}: BlogDeleteMenuProps): React.JSX.Element | null {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthorized = useBlogAdminAuthorization(initialAuthorized);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (containerRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  if (!isAuthorized) {
    return null;
  }

  const handleDelete = async (): Promise<void> => {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'Failed to delete blog post'));
      }

      onDeleted?.();
      setIsOpen(false);

      if (redirectTo) {
        router.replace(redirectTo);
        return;
      }

      if (refreshOnDelete) {
        router.refresh();
      }
    } catch (err) {
      setError(getClientErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex shrink-0 flex-col items-end gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Blog actions for ${title}`}
        className="rounded-md border border-code-border/80 bg-surface-elevated/70 p-2 text-text-muted transition-colors hover:cursor-pointer hover:border-primary/40 hover:text-primary"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setError(null);
          setIsOpen((currentValue) => !currentValue);
        }}
      >
        <HiOutlineDotsHorizontal className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 z-20 min-w-44 rounded-lg border border-code-border bg-code-bg p-2 shadow-xl">
          <button
            type="button"
            role="menuitem"
            aria-label="Delete blog"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleDelete();
            }}
            disabled={isDeleting}
            className="flex w-full items-center justify-between rounded-md bg-surface-elevated/95 px-3 py-2 text-left font-mono text-terminal-red text-xs transition-colors hover:cursor-pointer hover:bg-terminal-red/80 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isDeleting ? 'Deleting...' : 'Delete blog'}</span>
          </button>
          {error && (
            <p className="px-3 pt-2 pb-1 text-terminal-red text-xs leading-relaxed">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BlogDeleteMenu;

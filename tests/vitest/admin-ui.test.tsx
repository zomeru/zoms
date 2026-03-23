// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ReindexAdminCard from '@/components/ai/ReindexAdminCard';

describe('admin UI behaviors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('unlocks manual reindex and submits a targeted reindex request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes('/api/ai/reindex/auth')) {
          return new Response(JSON.stringify({ authorized: true, success: true }), {
            headers: {
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }

        if (url.includes('/api/ai/reindex')) {
          expect(init?.method).toBe('POST');
          expect(init?.body).toBe(JSON.stringify({ documentId: 'blog:new-post' }));

          return new Response(
            JSON.stringify({
              processed: 1,
              runId: 'run-id',
              skipped: 0,
              updated: 1
            }),
            {
              headers: {
                'Content-Type': 'application/json'
              },
              status: 200
            }
          );
        }

        return new Response(null, { status: 404 });
      })
    );

    render(<ReindexAdminCard initialAuthorized={false} />);

    fireEvent.change(screen.getByLabelText('AI reindex secret'), {
      target: { value: 'secret' }
    });
    const unlockForm = screen.getByRole('button', { name: 'Enter' }).closest('form');

    if (!unlockForm) {
      throw new Error('Expected the reindex unlock button to be inside a form.');
    }

    fireEvent.submit(unlockForm);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Run Full' })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Document id or slug'), {
      target: { value: 'blog:new-post' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run Targeted' }));

    await waitFor(() => {
      expect(screen.getByText(/run-id/i)).toBeTruthy();
      expect(screen.getByText(/processed 1/i)).toBeTruthy();
    });
  });
});

/* eslint-disable max-lines -- chat UI behavior coverage intentionally lives in one integration-style test file */
// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatComposer from '@/components/ai/ChatComposer';
import ChatLauncher from '@/components/ai/ChatLauncher';
import ChatMessageList from '@/components/ai/ChatMessageList';
import ChatPanel from '@/components/ai/ChatPanel';
import { useChatAssistant } from '@/components/ai/useChatAssistant';

function HookHarness() {
  const assistant = useChatAssistant({ pathname: '/' });

  return (
    <div>
      <div data-testid='history-loading'>
        {assistant.isHistoryLoadingInitial ? 'loading' : 'idle'}
      </div>
      <div data-testid='has-more-history'>{assistant.hasMoreHistory ? 'yes' : 'no'}</div>
      <button
        type='button'
        onClick={() => {
          void assistant.loadOlderHistory();
        }}
      >
        Load older
      </button>
      {assistant.messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}

describe('chat UI behaviors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates chat history from the secure session cookie on reload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes('/api/ai/chat')) {
          return new Response(
            JSON.stringify({
              hasMore: false,
              limit: 10,
              messages: [
                {
                  content: 'Earlier question',
                  id: 'user-1',
                  role: 'user'
                },
                {
                  content: 'Earlier answer',
                  id: 'assistant-1',
                  messageId: 'assistant-1',
                  role: 'assistant',
                  supported: true
                }
              ],
              offset: 0,
              sessionKey: 'session-key',
              total: 2
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

    render(<HookHarness />);

    expect(screen.getByTestId('history-loading').textContent).toBe('loading');

    await waitFor(() => {
      expect(screen.getByText('Earlier question')).toBeTruthy();
      expect(screen.getByText('Earlier answer')).toBeTruthy();
    });
    expect(screen.getByTestId('history-loading').textContent).toBe('idle');
    expect(screen.getByText(/thanks for visiting my website/i)).toBeTruthy();
    expect(window.localStorage.getItem('ai-chat-session')).toBeNull();
  });

  it('does not show the welcome message while cookie-backed history is still loading', async () => {
    const pendingHistoryResponse = Promise.withResolvers<Response>().promise;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => await pendingHistoryResponse)
    );

    render(<HookHarness />);

    expect(screen.getByTestId('history-loading').textContent).toBe('loading');
    expect(screen.queryByText(/thanks for visiting my website/i)).toBeNull();
  });

  it('shows a persistent welcome message for a fresh conversation with no history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 }))
    );

    render(<HookHarness />);

    expect(await screen.findByText(/thanks for visiting my website/i)).toBeTruthy();
    expect(screen.getByText(/ask me about my projects, experience, blogs/i)).toBeTruthy();
  });

  it('keeps the welcome message visible even when persisted history exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              hasMore: false,
              limit: 10,
              messages: [
                {
                  content: 'Earlier question',
                  id: 'user-1',
                  role: 'user'
                }
              ],
              offset: 0,
              sessionKey: 'session-key',
              total: 1
            }),
            {
              headers: {
                'Content-Type': 'application/json'
              },
              status: 200
            }
          )
      )
    );

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByText('Earlier question')).toBeTruthy();
    });
    expect(screen.getByText(/thanks for visiting my website/i)).toBeTruthy();
  });

  it('requests the latest history page first and can load older history on demand', async () => {
    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes('offset=0')) {
        return new Response(
          JSON.stringify({
            hasMore: true,
            limit: 10,
            messages: [
              {
                content: 'Recent question',
                id: 'user-recent',
                role: 'user'
              },
              {
                content: 'Recent answer',
                id: 'assistant-recent',
                messageId: 'assistant-recent',
                role: 'assistant',
                supported: true
              }
            ],
            offset: 0,
            sessionKey: 'session-key',
            total: 4
          }),
          {
            headers: {
              'Content-Type': 'application/json'
            },
            status: 200
          }
        );
      }

      if (url.includes('offset=2')) {
        return new Response(
          JSON.stringify({
            hasMore: false,
            limit: 10,
            messages: [
              {
                content: 'Older question',
                id: 'user-older',
                role: 'user'
              },
              {
                content: 'Older answer',
                id: 'assistant-older',
                messageId: 'assistant-older',
                role: 'assistant',
                supported: true
              }
            ],
            offset: 2,
            sessionKey: 'session-key',
            total: 4
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
    });

    vi.stubGlobal('fetch', fetchSpy);

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByText('Recent question')).toBeTruthy();
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/chat?limit=10&offset=0');
    expect(screen.getByTestId('has-more-history').textContent).toBe('yes');

    fireEvent.click(screen.getByRole('button', { name: 'Load older' }));

    await waitFor(() => {
      expect(screen.getByText('Older question')).toBeTruthy();
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/chat?limit=10&offset=2');
    expect(screen.getAllByText(/question$/)).toHaveLength(2);
    expect(screen.getByTestId('has-more-history').textContent).toBe('no');
  });

  it('does not render feedback controls for assistant messages', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content: 'Completed answer',
            id: 'assistant-done',
            messageId: 'assistant-done',
            role: 'assistant',
            supported: true
          }
        ]}
      />
    );

    expect(screen.queryByRole('button', { name: 'Helpful' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Not helpful' })).toBeNull();
  });

  it('submits the composer when Enter is pressed without Shift', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Assistant question');
    fireEvent.change(textarea, { target: { value: 'Tell me about Evelan.' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Tell me about Evelan.');
    });
  });

  it('submits the composer from the inline send button and enforces a max length', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Assistant question');
    expect(textarea.getAttribute('maxLength')).toBe('500');

    fireEvent.change(textarea, { target: { value: 'A concise question about the site.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('A concise question about the site.');
    });
  });

  it('shows a live character counter for the composer input', () => {
    render(<ChatComposer onSubmit={vi.fn(async () => undefined)} />);

    const textarea = screen.getByLabelText('Assistant question');
    fireEvent.change(textarea, { target: { value: 'x'.repeat(132) } });

    expect(screen.getByText('132/500')).toBeTruthy();
  });

  it('shows animated typing dots while an assistant message is still pending', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content: '',
            id: 'assistant-pending',
            isPending: true,
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByLabelText('Assistant is responding')).toBeTruthy();
  });

  it('does not render the related content section inside chat messages', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content: 'Here is an answer.',
            id: 'assistant-1',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.queryByText('You might also want')).toBeNull();
    expect(screen.queryByText('Related blog post')).toBeNull();
  });

  it('renders blog citations using the blog title as the card content', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            citations: [
              {
                contentType: 'blog',
                id: 'blog-citation-1',
                sectionTitle: 'Summary',
                snippet: 'Building a grounded assistant',
                title: 'Building a grounded assistant',
                url: '/blog/grounded-assistant'
              }
            ],
            content: 'Here is an answer.',
            id: 'assistant-1',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Building a grounded assistant' })).toBeTruthy();
    expect(screen.queryByText('Summary')).toBeNull();
    expect(screen.getAllByText('Building a grounded assistant')).toHaveLength(1);
  });

  it('deduplicates duplicate citation cards in chat messages', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            citations: [
              {
                contentType: 'blog',
                id: 'direct:blog:latest:duplicate-1',
                sectionTitle: 'Summary',
                snippet: 'Duplicate blog post',
                title: 'Duplicate blog post',
                url: '/blog/duplicate-blog-post'
              },
              {
                contentType: 'blog',
                id: 'direct:blog:latest:duplicate-2',
                sectionTitle: 'Summary',
                snippet: 'Duplicate blog post',
                title: 'Duplicate blog post',
                url: '/blog/duplicate-blog-post'
              }
            ],
            content: 'Here are the citations.',
            id: 'assistant-duplicate-citations',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getAllByRole('link', { name: 'Duplicate blog post' })).toHaveLength(1);
  });

  it('renders fenced code blocks as code snippets inside assistant messages', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content:
              'Here is some TypeScript:\n```ts\nconst greeting: string = "hello";\nconsole.log(greeting);\n```',
            id: 'assistant-code',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByText('Here is some TypeScript:')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(
      screen.getByText(
        (_, element) =>
          element !== null &&
          element.tagName === 'CODE' &&
          typeof element.textContent === 'string' &&
          element.textContent.includes('const greeting: string = "hello";')
      )
    ).toBeTruthy();
    expect(screen.queryByText('```ts')).toBeNull();
  });

  it('defines highlight.js theme styles for chat code blocks', () => {
    const globalsCss = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');

    expect(globalsCss).toContain('.llm-markdown .hljs');
    expect(globalsCss).toContain('.llm-markdown .hljs-keyword');
    expect(globalsCss).toContain('.llm-markdown .hljs-string');
  });

  it('streams an open fenced code block before the closing fence arrives', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content: 'Streaming code:\n```typescript\nexport const answer = 42;',
            id: 'assistant-code-stream',
            isPending: true,
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByText('Streaming code:')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.queryByText('```typescript')).toBeNull();
  });

  it('renders assistant markdown with inline code, lists, and links', () => {
    render(
      <ChatMessageList
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        messages={[
          {
            content:
              'Use `TypeScript` for this.\n\n- Strong typing\n- Great tooling\n\n[Read more](https://www.typescriptlang.org/)',
            id: 'assistant-markdown',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Strong typing')).toBeTruthy();
    expect(screen.getByText('Great tooling')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Read more' }).getAttribute('href')).toBe(
      'https://www.typescriptlang.org/'
    );
  });

  it('updates the launcher and panel copy to chat with Zomer', () => {
    render(<ChatLauncher onClick={() => undefined} />);

    expect(screen.getByText('Chat with Zomer')).toBeTruthy();
    expect(screen.getByText('AI Persona')).toBeTruthy();
    expect(screen.queryByText('Ask the site')).toBeNull();
    expect(screen.queryByText('AI Personal')).toBeNull();

    render(
      <ChatPanel
        hasMoreHistory={false}
        isHistoryLoadingInitial={false}
        isLoadingOlderHistory={false}
        isOpen={true}
        isWorking={false}
        onLoadOlderHistory={async () => undefined}
        messages={[]}
        onClose={() => undefined}
        onSend={async () => undefined}
        onTransform={async () => undefined}
      />
    );

    expect(screen.getAllByText('Chat with Zomer').length).toBeGreaterThan(0);
  });
});

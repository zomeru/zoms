// @vitest-environment jsdom

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
      {assistant.messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}

describe('chat UI behaviors', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('hydrates chat history from the persisted session on reload', async () => {
    window.localStorage.setItem('ai-chat-session', 'session-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes('/api/ai/chat')) {
          return new Response(
            JSON.stringify({
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
              sessionKey: 'session-key'
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

    await waitFor(() => {
      expect(screen.getByText('Earlier question')).toBeTruthy();
      expect(screen.getByText('Earlier answer')).toBeTruthy();
    });
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

  it('does not prepend the synthetic welcome message when persisted history exists', async () => {
    window.localStorage.setItem('ai-chat-session', 'session-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              messages: [
                {
                  content: 'Earlier question',
                  id: 'user-1',
                  role: 'user'
                }
              ],
              sessionKey: 'session-key'
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
    expect(screen.queryByText(/thanks for visiting my website/i)).toBeNull();
  });

  it('does not render feedback controls for assistant messages', () => {
    render(
      <ChatMessageList
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

  it('shows animated typing dots while an assistant message is still pending', () => {
    render(
      <ChatMessageList
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

  it('renders fenced code blocks as code snippets inside assistant messages', () => {
    render(
      <ChatMessageList
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
    expect(screen.getByText('TS')).toBeTruthy();
    expect(screen.getByText(/const greeting: string = "hello";/)).toBeTruthy();
    expect(screen.queryByText('```ts')).toBeNull();
  });

  it('streams an open fenced code block before the closing fence arrives', () => {
    render(
      <ChatMessageList
        messages={[
          {
            content: 'Streaming code:\n```typescript\nexport const answer = 42;',
            id: 'assistant-code-stream',
            role: 'assistant'
          }
        ]}
      />
    );

    expect(screen.getByText('Streaming code:')).toBeTruthy();
    expect(screen.getByText('TYPESCRIPT')).toBeTruthy();
    expect(screen.getByText(/export const answer = 42;/)).toBeTruthy();
    expect(screen.queryByText('```typescript')).toBeNull();
  });

  it('updates the launcher and panel copy to chat with Zomer', () => {
    render(<ChatLauncher onClick={() => undefined} />);

    expect(screen.getByText('Chat with Zomer')).toBeTruthy();
    expect(screen.getByText('AI Persona')).toBeTruthy();
    expect(screen.queryByText('Ask the site')).toBeNull();
    expect(screen.queryByText('AI Personal')).toBeNull();

    render(
      <ChatPanel
        isOpen={true}
        isWorking={false}
        messages={[]}
        onClose={() => undefined}
        onSend={async () => undefined}
        onTransform={async () => undefined}
      />
    );

    expect(screen.getAllByText('Chat with Zomer').length).toBeGreaterThan(0);
  });
});

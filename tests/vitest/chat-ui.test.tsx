// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatComposer from '@/components/ai/ChatComposer';
import ChatMessageList from '@/components/ai/ChatMessageList';
import FeedbackControls from '@/components/ai/FeedbackControls';
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

  it('shows feedback controls only after a completed assistant response with a message id', () => {
    const { rerender } = render(
      <FeedbackControls
        message={{
          content: 'Streaming...',
          id: 'assistant-pending',
          role: 'assistant'
        }}
        onFeedback={async () => undefined}
      />
    );

    expect(screen.queryByRole('button', { name: 'Helpful' })).toBeNull();

    rerender(
      <FeedbackControls
        message={{
          content: 'Completed answer',
          id: 'assistant-done',
          messageId: 'assistant-done',
          role: 'assistant',
          supported: true
        }}
        onFeedback={async () => undefined}
      />
    );

    expect(screen.getByRole('button', { name: 'Helpful' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeTruthy();
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
        onCitationClick={() => undefined}
        onFeedback={async () => undefined}
      />
    );

    expect(screen.getByLabelText('Assistant is responding')).toBeTruthy();
  });
});

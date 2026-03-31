'use client';

import { usePathname } from 'next/navigation';

import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';
import { useChatAssistant } from './useChatAssistant';

export default function ChatAssistantShell() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const assistant = useChatAssistant({ pathname });

  return (
    <>
      <ChatPanel
        blogSlug={assistant.blogSlug}
        error={assistant.error}
        hasMoreHistory={assistant.hasMoreHistory}
        isHistoryLoadingInitial={assistant.isHistoryLoadingInitial}
        isLoadingOlderHistory={assistant.isLoadingOlderHistory}
        isOpen={assistant.isOpen}
        isWorking={assistant.isWorking}
        messages={assistant.messages}
        onClose={() => assistant.setIsOpen(false)}
        onLoadOlderHistory={assistant.loadOlderHistory}
        onSend={assistant.sendQuestion}
        onTransform={assistant.requestTransform}
      />
      {!assistant.isOpen && <ChatLauncher onClick={() => assistant.setIsOpen(true)} />}
    </>
  );
}

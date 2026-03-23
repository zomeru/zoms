'use client';

import { usePathname } from 'next/navigation';

import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';
import { useChatAssistant } from './useChatAssistant';

export default function ChatAssistantShell() {
  const pathname = usePathname();
  const assistant = useChatAssistant({ pathname });

  return (
    <>
      <ChatPanel
        blogSlug={assistant.blogSlug}
        error={assistant.error}
        isOpen={assistant.isOpen}
        isWorking={assistant.isWorking}
        messages={assistant.messages}
        onClose={() => assistant.setIsOpen(false)}
        onSend={assistant.sendQuestion}
        onTransform={assistant.requestTransform}
      />
      {!assistant.isOpen && <ChatLauncher onClick={() => assistant.setIsOpen(true)} />}
    </>
  );
}

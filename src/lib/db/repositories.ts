export type { ChatMessageInput, ChatSessionInput } from "./chatRepository";
export { chatRepository } from "./chatRepository";
export type { IndexedDocumentInput } from "./indexedDocRepository";
export { indexedDocRepository } from "./indexedDocRepository";
export type { IngestionRunInput } from "./ingestionRepository";
export { ingestionRepository } from "./ingestionRepository";
export { retrievalRepository } from "./retrievalRepository";

import { chatRepository } from "./chatRepository";
import { indexedDocRepository } from "./indexedDocRepository";
import { ingestionRepository } from "./ingestionRepository";
import { retrievalRepository } from "./retrievalRepository";

// Backward-compat namespace — existing callers use repositories.* unchanged.
export const repositories = {
  ...chatRepository,
  ...indexedDocRepository,
  ...ingestionRepository,
  ...retrievalRepository
};

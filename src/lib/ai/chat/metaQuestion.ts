// Meta-questions reference THIS chat session rather than portfolio content.
// Patterns below are unioned; keep each piece narrow to avoid false positives on
// portfolio queries that happen to mention "history", "chat", "questions", etc.
const CHAT_META_PATTERNS: RegExp[] = [
  // Possessive references to the session ("my messages", "our conversation")
  /\b(my|our) (messages?|questions?|chats?|conversations?|history|prompts?|replies)\b/i,
  // "what did/have I/we ..." — explicit retrospectives
  /\bwhat (did|have|was|were) (i|we|you)\b/i,
  // Summarize / recap / list / repeat / remind of conversation
  /\b(summariz(e|ing|ation)|recap|recaps?|remind me (of|about)|list( out)?|repeat|replay|restate|rephrase) (the|this|that|our|my|your)( previous| earlier| prior| last)? (conversation|chat|messages?|questions?|answers?|replies|exchange|discussion|thread|response)\b/i,
  // "previous/earlier/prior/last (N) question(s)/message(s)/answer(s)"
  /\b(previous|earlier|prior|last|first) (few |\d+ )?(questions?|messages?|answers?|prompts?|replies|responses?)\b/i,
  // "tell me again what ..." style
  /\b(tell me again|say (that|it) again|what('| was) my (earlier|previous|first|last))\b/i,
  // Direct references to THIS chat
  /\bthis (chat|conversation|session|thread)\b/i
];

export function isChatMetaQuestion(question: string): boolean {
  return CHAT_META_PATTERNS.some((re) => re.test(question));
}

export const CHAT_META_HISTORY_LIMIT = 50;
export const CHAT_DEFAULT_HISTORY_LIMIT = 12;

export function resolveChatHistoryLimit(question: string): number {
  return isChatMetaQuestion(question) ? CHAT_META_HISTORY_LIMIT : CHAT_DEFAULT_HISTORY_LIMIT;
}

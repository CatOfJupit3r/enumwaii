type Scope =
  | { kind: "STORY"; storyId: string; chatId?: never }
  | { kind: "CHAT"; storyId: string; chatId: string };

declare const scope: Scope;

export const hasChat = "chatId" in scope;

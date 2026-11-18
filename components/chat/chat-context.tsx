"use client";

import { useAction } from "convex/react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";

export type ChatMessage = { role: "user" | "assistant"; content: string; failed?: boolean };

type ChatState = {
  isOpen: boolean;
  messages: ChatMessage[];
  pending: boolean;
  open: (question?: string) => void;
  close: () => void;
  send: (question: string) => Promise<void>;
  reset: () => void;
};

const ChatContext = createContext<ChatState | null>(null);

/** Keeps the conversation alive while you move between pages. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const ask = useAction(api.assistant.ask);
  const [isOpen, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || pending) return;
      const history: ChatMessage[] = [...messages, { role: "user", content: q }];
      setMessages(history);
      setPending(true);
      try {
        const res = await ask({
          // Failed replies are UI-only; don't send them back as history.
          messages: history.filter((m) => !m.failed).map(({ role, content }) => ({ role, content })),
        });
        setMessages((m) => [...m, { role: "assistant", content: res.text, failed: !res.ok }]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "I couldn't reach the family archive. Please try again.", failed: true },
        ]);
      } finally {
        setPending(false);
      }
    },
    [ask, messages, pending],
  );

  const open = useCallback(
    (question?: string) => {
      setOpen(true);
      if (question) void send(question);
    },
    [send],
  );

  const value = useMemo<ChatState>(
    () => ({
      isOpen,
      messages,
      pending,
      open,
      close: () => setOpen(false),
      send,
      reset: () => setMessages([]),
    }),
    [isOpen, messages, pending, open, send],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}

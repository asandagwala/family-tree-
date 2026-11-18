"use client";

import { ArrowUp, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "../logo";
import { useChat } from "./chat-context";
import { RichText } from "./rich-text";
import { AskIcon } from "../ask-icon";

export const SUGGESTIONS = [
  "Who is the eldest living member of the family?",
  "Where does our family come from?",
  "Which clan names appear in our family?",
  "Whose details are still missing?",
];

export function ChatDrawer() {
  const chat = useChat();
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const { isOpen, close } = chat;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.pending]);

  useEffect(() => {
    if (isOpen) input.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const submit = () => {
    if (!draft.trim()) return;
    void chat.send(draft);
    setDraft("");
  };

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Ask the family"
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="relative overflow-hidden border-b border-line bg-card px-6 pb-7 pt-6 text-ink">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-mint">
                <AskIcon size={18} className="text-forest" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold leading-none">Ask the family</h2>
                <p className="mt-1 text-xs text-muted">Answers come from what&apos;s recorded in your tree</p>
              </div>
            </div>
            <div className="flex gap-1">
              {chat.messages.length > 0 && (
                <button
                  type="button"
                  onClick={chat.reset}
                  title="New conversation"
                  aria-label="New conversation"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </header>

        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin px-5 py-6">
          {chat.messages.length === 0 && (
            <div className="animate-rise">
              <div className="flex flex-col items-center px-4 pb-6 pt-4 text-center">
                <LogoMark size={44} className="text-forest" />
                <p className="mt-4 font-display text-2xl leading-snug text-coal">
                  Every family is a story.
                  <br />
                  What would you like to know?
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void chat.send(s)}
                    className="rounded-2xl border border-line bg-card px-4 py-3 text-left text-sm text-coal transition-colors hover:border-sage hover:bg-mint/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end animate-rise">
                <div className="max-w-[85%] rounded-3xl rounded-br-md bg-forest px-4 py-2.5 text-sm text-white">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3 animate-rise">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint">
                  <LogoMark size={16} className="text-evergreen" />
                </span>
                <div
                  className={`max-w-[88%] rounded-3xl rounded-tl-md px-4 py-3 text-sm leading-relaxed ${
                    m.failed ? "border border-silver bg-mist/50 text-night" : "bg-card text-ink shadow-sm"
                  }`}
                >
                  <RichText text={m.content} onNavigate={close} />
                </div>
              </div>
            ),
          )}

          {chat.pending && (
            <div className="flex gap-3">
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint">
                <LogoMark size={16} className="text-evergreen" />
              </span>
              <div className="flex items-center gap-2 rounded-3xl rounded-tl-md bg-card px-4 py-4 shadow-sm">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rotate-45 animate-pulse bg-sage"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
                <span className="text-xs text-muted">Looking through the records…</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="border-t border-line bg-card p-4"
        >
          <div className="flex items-end gap-2 rounded-3xl border border-line bg-paper py-1.5 pl-4 pr-1.5 focus-within:border-slate-soft">
            <textarea
              ref={input}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask about anyone in the family…"
              className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={!draft.trim() || chat.pending}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-white transition-opacity disabled:opacity-30"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

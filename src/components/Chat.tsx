"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

type ChatUI = {
  title: string;
  subtitle: string;
  disclaimer: string;
  suggestions: string[];
};

function errorText(message: string) {
  try {
    const parsed = JSON.parse(message);
    if (parsed?.error) return String(parsed.error);
  } catch {}
  return "Не удалось получить ответ. Попробуйте позже.";
}

export default function Chat({ ui }: { ui: ChatUI }) {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4">
      <header className="border-b border-slate-200 py-4">
        <h1 className="text-lg font-medium text-slate-900">{ui.title}</h1>
        <p className="text-sm text-slate-500">{ui.subtitle}</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Задайте вопрос или выберите пример:</p>
            <div className="flex flex-wrap gap-2">
              {ui.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-slate-800 px-4 py-2 text-slate-50"
                  : "max-w-[85%] whitespace-pre-wrap text-slate-900"
              }
            >
              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && <p className="text-sm text-slate-400">Думаю…</p>}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {errorText(error.message)}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-slate-200 py-3"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder="Ваш вопрос"
            aria-label="Ваш вопрос"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Отправить
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">{ui.disclaimer}</p>
      </form>
    </main>
  );
}

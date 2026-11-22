import type { DomainPack } from "./types";

export const defaultPack: DomainPack = {
  id: "default",
  title: "AI-ассистент",
  subtitle: "Каркас на Next.js, LangGraph и Gemini",
  systemPrompt:
    "Ты дружелюбный ассистент. Отвечай кратко и по делу, на языке пользователя. " +
    "Если не знаешь ответа, честно скажи об этом.",
  disclaimer: "Демо-проект. Ответы могут содержать ошибки.",
  suggestions: ["Что ты умеешь?", "Объясни, как работает LangGraph"],
};

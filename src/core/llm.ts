import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createLLM() {
  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
    temperature: 0.3,
    streaming: true,
  });
}

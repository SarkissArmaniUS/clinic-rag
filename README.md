# AI assistant skeleton / clinic-rag-v1

Next.js + LangGraph + Gemini + Vercel AI SDK (UI и стриминг).

## Start

```bash
npx create-next-app@latest ai-assistant --ts --tailwind --app --eslint
cd ai-assistant
npm i ai @ai-sdk/react @ai-sdk/langchain @langchain/core @langchain/langgraph @langchain/google-genai @upstash/ratelimit @upstash/redis
```

## Structure
- `packs/` — доменные пакеты (позже `finance`, `clinic`)
- `core/` — граф LangGraph, модель, rate limit (общее для всех проектов)
- `app/api/chat/route.ts` — endpoint со стримингом
- `components/Chat.tsx` — интерфейс чата
# clinic-llm

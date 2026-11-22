import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { buildGraph } from "@/core/graph";
import { checkRateLimit } from "@/core/ratelimit";
import { pack } from "@/packs";

export const maxDuration = 30;

const MAX_CHARS = 1000;
const MAX_HISTORY = 10;

const graph = buildGraph(pack);

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    if (!(await checkRateLimit(ip))) {
      return fail("Слишком много запросов. Подождите минуту.", 429);
    }

    const { messages }: { messages: UIMessage[] } = await req.json();
    const last = messages?.at(-1);
    const text = (last?.parts ?? [])
      .flatMap((p) => (p.type === "text" ? [p.text] : []))
      .join("");

    if (!text.trim()) return fail("Пустое сообщение.", 400);
    if (text.length > MAX_CHARS) {
      return fail(`Сообщение слишком длинное (максимум ${MAX_CHARS} символов).`, 400);
    }

    const langchainMessages = await toBaseMessages(messages.slice(-MAX_HISTORY));

    const stream = await graph.stream(
      { messages: langchainMessages },
      { streamMode: ["values", "messages"] }
    );

    return createUIMessageStreamResponse({ stream: toUIMessageStream(stream) });
  } catch (err) {
    console.error("chat error", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return fail("Лимит бесплатной модели на сегодня исчерпан. Попробуйте позже.", 429);
    }
    return fail("Не удалось получить ответ. Попробуйте позже.", 500);
  }
}

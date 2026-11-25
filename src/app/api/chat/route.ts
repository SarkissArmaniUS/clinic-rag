import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { accessRequired, verifyKey } from "@/core/access";
import { buildGraph } from "@/core/graph";
import { checkRateLimit } from "@/core/ratelimit";
import { pack } from "@/packs";

export const maxDuration = 30;

const MAX_CHARS = 1000;
const MAX_HISTORY = 10;

const graph = buildGraph(pack);

function fail(message: string, status: number, code?: string) {
  return Response.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

    const owner = verifyKey((await cookies()).get("access_key")?.value);
    if (accessRequired() && !owner) {
      return fail("Access code required.", 401, "ACCESS_REQUIRED");
    }

    if (!(await checkRateLimit(owner ?? ip))) {
      return fail("Too many requests. Please wait a minute.", 429);
    }

    const { messages }: { messages: UIMessage[] } = await req.json();
    const last = messages?.at(-1);
    const text = (last?.parts ?? [])
        .flatMap((p) => (p.type === "text" ? [p.text] : []))
        .join("");

    if (!text.trim()) return fail("Empty message.", 400);
    if (text.length > MAX_CHARS) {
      return fail(`Message is too long (maximum ${MAX_CHARS} characters).`, 400);
    }

    const langchainMessages = await toBaseMessages(messages.slice(-MAX_HISTORY));
    const stream = await graph.stream(
        { messages: langchainMessages },
        { streamMode: ["values", "messages"], recursionLimit: 12 }
    );

    return createUIMessageStreamResponse({ stream: toUIMessageStream(stream) });
  } catch (err) {
    console.error("chat error", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return fail("The free model's daily limit has been reached. Please try again later.", 429);
    }
    return fail("Failed to get a response. Please try again later.", 500);
  }
}
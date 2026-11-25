import { Annotation, StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLLM } from "./llm";
import { searchDocs } from "./retrieve";
import type { DomainPack } from "@/packs/types";

const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  context: Annotation<string>(),
});
type State = typeof GraphState.State;

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => (p as { text?: string }).text ?? "").join(" ");
  }
  return "";
}

function lastText(state: State): string {
  return textOf(state.messages.at(-1)?.content).toLowerCase().replace(/ё/g, "е");
}

function recentUserText(state: State, n = 2): string {
  return state.messages
      .filter((m) => m instanceof HumanMessage)
      .slice(-n)
      .map((m) => textOf(m.content))
      .join("\n");
}

function todayInKyiv(): string {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Kyiv",
  }).format(new Date());
}

export function buildGraph(pack: DomainPack) {
  const llm = createLLM();
  const hasTools = pack.tools.length > 0;
  const agentLLM = hasTools ? llm.bindTools(pack.tools) : llm;

  const emergency = async (state: State) => {
    const response = await llm.invoke([
      new SystemMessage(pack.emergencyPrompt),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const retrieve = async (state: State) => {
    try {
      const chunks = await searchDocs(recentUserText(state));
      const context = chunks
          .map((c) => `[Source: ${c.source}]\n${c.content}`)
          .join("\n\n");
      return { context };
    } catch (err) {
      console.error("retrieve error", err);
      return { context: "" };
    }
  };

  const answer = async (state: State) => {
    const rag = state.context
        ? [
          "Below are excerpts from the clinic's documents.",
          "Answer questions about services, prices, doctors, schedules, and procedure preparation ONLY based on them.",
          "If the excerpts do not contain the answer, say that you don't know and refer the person to the administrator.",
          "If you used the documents, end your answer with: Source: file_name.",
          "",
          state.context,
        ].join("\n")
        : [
          "No documents were found for this question.",
          "If the question is about services, prices, doctors, schedules, or preparation, say that you do not have this information and refer the person to the administrator.",
          "Do not make anything up.",
        ].join(" ");

    const response = await agentLLM.invoke([
      new SystemMessage(`${pack.systemPrompt}\n\nCurrent time: ${todayInKyiv()}.\n\n${rag}`),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const route = (state: State) =>
      pack.emergencyKeywords.some((k) => lastText(state).includes(k)) ? "emergency" : "retrieve";

  const graph = new StateGraph(GraphState)
      .addNode("emergency", emergency)
      .addNode("retrieve", retrieve)
      .addNode("answer", answer)
      .addNode("tools", new ToolNode(pack.tools))
      .addConditionalEdges(START, route, ["emergency", "retrieve"])
      .addEdge("retrieve", "answer")
      .addConditionalEdges("answer", toolsCondition, ["tools", END])
      .addEdge("tools", "answer")
      .addEdge("emergency", END);

  return graph.compile();
}
import { Annotation, StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
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

export function buildGraph(pack: DomainPack) {
  const llm = createLLM();

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
          "Below are excerpts from the clinic documents.",
          "Answer questions about services, prices, doctors, schedules, and procedure preparation ONLY based on these excerpts.",
          "If the excerpts do not contain the answer, say that you do not know and refer the user to the administrator.",
          "If you used the documents, include the following at the end of your answer: Source: filename.",
          "",
          state.context,
        ].join("\n")
      : [
          "No documents related to this question were found.",
          "If the question is about services, prices, doctors, schedules, or preparation, say that you do not have this information and refer the user to the administrator.",
          "Do not make anything up.",
        ].join(" ");

    const response = await llm.invoke([
      new SystemMessage(`${pack.systemPrompt}\n\n${rag}`),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const route = (state: State) =>
    pack.emergencyKeywords.some((k) => lastText(state).includes(k)) ? "emergency" : "retrieve";

  return new StateGraph(GraphState)
    .addNode("emergency", emergency)
    .addNode("retrieve", retrieve)
    .addNode("answer", answer)
    .addConditionalEdges(START, route, ["emergency", "retrieve"])
    .addEdge("retrieve", "answer")
    .addEdge("answer", END)
    .addEdge("emergency", END)
    .compile();
}

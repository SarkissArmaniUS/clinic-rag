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

// Последние сообщения пользователя: помогает с уточняющими вопросами вроде «а сколько стоит?»
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
        .map((c) => `[Источник: ${c.source}]\n${c.content}`)
        .join("\n\n");
      return { context };
    } catch (err) {
      // Если база недоступна, бот продолжает работать, но без документов
      console.error("retrieve error", err);
      return { context: "" };
    }
  };

  const answer = async (state: State) => {
    const rag = state.context
      ? [
          "Ниже выдержки из документов клиники.",
          "Вопросы об услугах, ценах, врачах, графике и подготовке к процедурам отвечай ТОЛЬКО на их основе.",
          "Если в выдержках нет ответа, скажи, что не знаешь, и отправь к администратору.",
          "Если использовал документы, в конце ответа укажи: Источник: имя_файла.",
          "",
          state.context,
        ].join("\n")
      : [
          "Документов по этому вопросу не найдено.",
          "Если вопрос про услуги, цены, врачей, график или подготовку, скажи, что у тебя нет такой информации, и отправь к администратору.",
          "Ничего не выдумывай.",
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

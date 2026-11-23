import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { getSupabase } from "./supabase";

export type Chunk = { source: string; content: string; similarity: number };

export function createEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001" });
}

export async function searchDocs(query: string, k = 4): Promise<Chunk[]> {
  const minSimilarity = Number(process.env.MIN_SIMILARITY ?? 0.55);
  const vector = await createEmbeddings().embedQuery(query);

  const { data, error } = await getSupabase().rpc("match_documents", {
    query_embedding: vector,
    match_count: k,
    min_similarity: minSimilarity,
  });
  if (error) throw error;

  const chunks = (data ?? []) as Chunk[];
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[rag]",
      JSON.stringify(query.slice(0, 60)),
      chunks.map((c) => `${c.source}:${c.similarity.toFixed(2)}`)
    );
  }
  return chunks;
}

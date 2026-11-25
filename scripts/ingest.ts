import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createEmbeddings } from "../src/core/retrieve";
import { getSupabase } from "../src/core/supabase";

const DIR = path.join(process.cwd(), "data", "clinic");

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".md"));
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 700, chunkOverlap: 80 });

  const rows: { source: string; content: string }[] = [];
  for (const file of files) {
    const text = await readFile(path.join(DIR, file), "utf8");
    for (const chunk of await splitter.splitText(text)) {
      rows.push({ source: file, content: chunk });
    }
  }
  console.log(`Files: ${files.length}, chunks: ${rows.length}`);

  const vectors = await createEmbeddings().embedDocuments(rows.map((r) => r.content));

  const supabase = getSupabase();
  const { error: delError } = await supabase.from("documents").delete().gte("id", 0);
  if (delError) throw delError;

  const { error } = await supabase
      .from("documents")
      .insert(rows.map((r, i) => ({ ...r, embedding: vectors[i] })));
  if (error) throw error;

  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
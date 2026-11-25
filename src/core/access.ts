import { createHash, timingSafeEqual } from "node:crypto";

type Entry = { name: string; hash: Buffer };

const sha = (s: string) => createHash("sha256").update(s).digest();

function loadKeys(): Entry[] {
  return (process.env.ACCESS_KEYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(":");
      const name = i > 0 ? pair.slice(0, i) : "user";
      const key = i > 0 ? pair.slice(i + 1) : pair;
      return { name, hash: sha(key) };
    });
}

export function accessRequired(): boolean {
  return loadKeys().length > 0;
}

export function verifyKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const candidate = sha(key);
  for (const entry of loadKeys()) {
    if (timingSafeEqual(candidate, entry.hash)) return entry.name;
  }
  return null;
}

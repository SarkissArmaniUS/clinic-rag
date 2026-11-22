export interface DomainPack {
  id: string;
  title: string;
  subtitle: string;
  systemPrompt: string;
  disclaimer: string;
  suggestions: string[];
  // Экстренные случаи: проверка идёт по ключевым словам, без участия LLM
  emergencyPrompt: string;
  emergencyKeywords: string[];
}

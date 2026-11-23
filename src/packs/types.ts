export interface DomainPack {
  id: string;
  title: string;
  subtitle: string;
  systemPrompt: string;
  disclaimer: string;
  suggestions: string[];

  emergencyPrompt: string;
  emergencyKeywords: string[];
}

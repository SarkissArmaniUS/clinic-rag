import Chat from "@/components/Chat";
import { pack } from "@/packs";

export default function Home() {
  // На клиент уходят только тексты интерфейса, системный промпт остаётся на сервере
  const { title, subtitle, disclaimer, suggestions } = pack;
  return <Chat ui={{ title, subtitle, disclaimer, suggestions }} />;
}

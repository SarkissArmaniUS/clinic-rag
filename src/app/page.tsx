import Chat from "@/components/Chat";
import { pack } from "@/packs";

export default function Home() {
  const { title, subtitle, disclaimer, suggestions } = pack;
  return <Chat ui={{ title, subtitle, disclaimer, suggestions }} />;
}

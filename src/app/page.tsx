import HomeClient from "./HomeClient";
import { loadMotos } from "@/lib/motos";

export default async function Home() {
  const motos = await loadMotos();
  const featured =
    motos.length >= 6
      ? [...motos].sort(() => 0.5 - Math.random()).slice(0, 6)
      : motos;
  return <HomeClient featured={featured} />;
}


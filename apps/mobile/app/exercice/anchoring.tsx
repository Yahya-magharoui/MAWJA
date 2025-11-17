import Screen from "../components/Screen";

const sections = [
  {
    title: "Ancrage 5-4-3-2-1",
    items: ["5 choses que tu vois", "4 que tu touches", "3 que tu entends", "2 que tu sens", "1 que tu goûtes"]
  }
];

export default function Anchoring() {
  return <Screen title="Ancrage" lead="Ramène-toi dans le présent avec tes sens." sections={sections} />;
}

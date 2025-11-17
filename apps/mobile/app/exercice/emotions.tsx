import Screen from "../components/Screen";

const sections = [
  {
    title: "Emotions",
    items: ["Nommer ce que tu ressens", "Choisir un exercice adapté (respiration, ancrage)"]
  }
];

export default function Emotions() {
  return <Screen title="Emotions" lead="Identifier et agir selon l’émotion." sections={sections} />;
}

import Screen from "../components/Screen";

const sections = [
  {
    title: "Mindful",
    items: ["Observation de la respiration", "Scanner corporel rapide"]
  }
];

export default function Mindful() {
  return <Screen title="Mindful" lead="Présence et retour aux sensations." sections={sections} />;
}

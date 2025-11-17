import Screen from "../components/Screen";

const sections = [
  {
    title: "Respiration",
    items: [
      "Inspire 4s, bloque 2s, expire 6-8s",
      "3 à 5 minutes pour redescendre"
    ]
  }
];

export default function Breathing() {
  return <Screen title="Respiration" lead="Routines de respiration." sections={sections} />;
}

import Screen from "../components/Screen";

const sections = [
  {
    title: "Respiration boost",
    items: ["Cycles courts pour réveiller", "Inspire/expire rapides sur 1 minute"]
  }
];

export default function RespirationBoost() {
  return <Screen title="Respiration boost" lead="Remonter l’énergie en douceur." sections={sections} />;
}

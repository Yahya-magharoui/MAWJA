import Screen from "../components/Screen";

const sections = [
  {
    title: "Safe place",
    items: ["Visualise un lieu sûr", "Utilise les 5 sens pour l’enrichir"]
  }
];

export default function SafePlace() {
  return <Screen title="Safe place" lead="Refuge intérieur pour calmer l’activation." sections={sections} />;
}

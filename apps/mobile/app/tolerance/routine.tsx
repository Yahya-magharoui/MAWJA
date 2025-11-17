import Screen from "../components/Screen";

const sections = [
  {
    title: "Routine",
    items: ["Planifie tes pratiques (respiration, ancrage)", "Alterner courts et longs formats"]
  }
];

export default function ToleranceRoutine() {
  return <Screen title="Routine" lead="Organise tes pratiques régulières." sections={sections} />;
}

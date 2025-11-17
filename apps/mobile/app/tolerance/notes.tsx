import Screen from "../components/Screen";

const sections = [
  {
    title: "Notes",
    paragraphs: ["Garde tes observations, déclencheurs, et techniques qui fonctionnent."]
  }
];

export default function ToleranceNotes() {
  return <Screen title="Notes" lead="Consigne tes observations." sections={sections} />;
}

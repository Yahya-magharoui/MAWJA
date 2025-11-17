import Screen from "../components/Screen";

const sections = [
  {
    title: "SBA",
    items: ["Stimulations sensorielles (visuel, auditif, tactile)", "Choisis 1-2 minutes par sens"]
  }
];

export default function Sba() {
  return <Screen title="SBA" lead="Stimulation bilatérale / sensorielle." sections={sections} />;
}

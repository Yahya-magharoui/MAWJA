import Screen from "../components/Screen";

const sections = [
  {
    title: "Historique",
    items: ["Enregistre tes épisodes (hyper/hypo)", "Ajoute quelles actions ont aidé"]
  }
];

export default function ToleranceHistorique() {
  return <Screen title="Historique" lead="Suivi des épisodes et retours." sections={sections} />;
}

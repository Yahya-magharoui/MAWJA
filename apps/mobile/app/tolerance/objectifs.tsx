import Screen from "../components/Screen";

const sections = [
  {
    title: "Objectifs",
    items: ["Fixe des objectifs réalistes", "Associe chaque objectif à un exercice clé"]
  }
];

export default function ToleranceObjectifs() {
  return <Screen title="Objectifs" lead="Définis tes objectifs personnels." sections={sections} />;
}

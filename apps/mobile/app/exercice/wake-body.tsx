import Screen from "../components/Screen";

const sections = [
  {
    title: "Réveil du corps",
    items: ["Mouvements doux : épaules, cou, hanches", "Marche lente ou mini séquence"]
  }
];

export default function WakeBody() {
  return <Screen title="Réveil du corps" lead="Bouger doucement pour revenir à soi." sections={sections} />;
}

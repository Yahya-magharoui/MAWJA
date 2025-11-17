import Screen from "./components/Screen";

const sections = [
  {
    title: "À surveiller",
    items: [
      "Ton état actuel : hyper / tolérance / hypo",
      "Rappels de routine : respiration, hydratation, micro-pauses"
    ]
  },
  {
    title: "Accès rapide",
    items: [
      "Hyperactivation, Hypoactivation",
      "Plan personnalisé et exercices associés"
    ]
  }
];

export default function AppArea() {
  return (
    <Screen
      title="Espace Mawja"
      lead="Vue condensée de ton état et des actions rapides."
      sections={sections}
    />
  );
}

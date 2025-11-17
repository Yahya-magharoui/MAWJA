import Screen from "./components/Screen";

const sections = [
  {
    title: "Objectifs",
    items: [
      "Définis des objectifs simples (respiration quotidienne, ancrage, sommeil)",
      "Suis tes progrès régulièrement"
    ]
  },
  {
    title: "Routine",
    items: [
      "Ajoute des rappels pour pratiquer",
      "Alterner exercices courts et longs"
    ]
  }
];

export default function Plan() {
  return <Screen title="Plan personnalisé" lead="Organise objectifs et routine." sections={sections} />;
}

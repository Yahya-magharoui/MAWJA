import Screen from "../components/Screen";

const sections = [
  {
    title: "Respiration",
    items: ["Coherence cardio-respiratoire", "Respiration abdominale", "Boost respiration"]
  },
  {
    title: "Ancrage & mindful",
    items: ["Ancrage 5-4-3-2-1", "Safe place", "Mindful / SBA"]
  },
  {
    title: "Mouvement",
    items: ["Réveil du corps", "Mini réveil", "Programme réveil"]
  }
];

export default function ExerciceHub() {
  return (
    <Screen
      title="Exercices"
      lead="Choisis un exercice adapté à ton état."
      sections={sections}
    />
  );
}

import Screen from "./components/Screen";

export default function Home() {
  return (
    <Screen
      title="Accueil Mawja"
      lead="Retrouve les principales sections : hyper/hypo, exercices, plan et aide."
      sections={[
        {
          title: "Raccourcis",
          items: [
            "Hyperactivation / Hypoactivation : repérer l’état et agir",
            "Exercices : respiration, ancrage, éveil du corps",
            "Plan personnalisé : objectifs, routine, notes"
          ]
        },
        {
          title: "En cas de crise",
          items: [
            "SOS et numéros d’urgence",
            "Exercices courts de respiration ou ancrage sensoriel"
          ]
        }
      ]}
    />
  );
}

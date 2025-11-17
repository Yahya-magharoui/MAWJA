import Screen from "./components/Screen";

const sections = [
  {
    title: "Historique",
    items: [
      "Consigne tes états (hyper / tolérance / hypo)",
      "Note les exercices qui t’ont aidé"
    ]
  }
];

export default function History() {
  return <Screen title="Historique" lead="Suivi de tes états et exercices." sections={sections} />;
}

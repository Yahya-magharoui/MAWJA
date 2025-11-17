import Screen from "./components/Screen";

const sections = [
  {
    title: "En cas d’urgence",
    items: [
      "Appelle les numéros utiles si tu es en danger",
      "Pratique une respiration lente pendant que l’aide arrive"
    ]
  }
];

export default function Sos() {
  return <Screen title="SOS" lead="Actions immédiates et numéros utiles." sections={sections} />;
}

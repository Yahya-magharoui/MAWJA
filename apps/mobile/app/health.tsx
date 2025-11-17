import Screen from "./components/Screen";

const sections = [
  {
    title: "Conseils santé",
    items: [
      "Hydratation et sommeil régulier",
      "Limiter les stimulants en période de stress",
      "Bouger doucement plusieurs fois par jour"
    ]
  }
];

export default function Health() {
  return <Screen title="Santé" lead="Conseils pour soutenir ton équilibre." sections={sections} />;
}

import Screen from "../components/Screen";

const tips = [
  "Observe tes signaux : respiration, rythme cardiaque, tension musculaire",
  "Planifie une routine d’auto-soin (respiration, hydratation, pauses courtes)",
  "Note ce qui t’aide à revenir à l’équilibre pour le réutiliser",
  "Partage tes limites autour de toi quand c’est possible"
];

export default function Tolerance() {
  return (
    <Screen
      title="Fenêtre de tolérance"
      lead="Une zone d’équilibre où tu peux gérer tes émotions et les stimulations extérieures."
      sections={[{ title: "Rester dans la fenêtre", items: tips }]}
    />
  );
}

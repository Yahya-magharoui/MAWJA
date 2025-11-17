import Screen from "./components/Screen";

const symptoms = [
  "Paralysie, déconnexion, engourdissement",
  "Fatigue intense, apathie, retrait social",
  "Déréalisation, confusion"
];

const actions = [
  "Bouge doucement : marche lente, étirements",
  "Hydrate-toi et respire profond 3 fois",
  "Ancrage sensoriel : 5-4-3-2-1 (vu/touché/entendu/odoré/goûté)"
];

export default function Hypoactivation() {
  return (
    <Screen
      title="Hypoactivation"
      lead="Quand le système se met en pause pour protéger."
      sections={[
        { title: "Ce que tu peux ressentir", items: symptoms },
        { title: "Premiers gestes suggérés", items: actions }
      ]}
    />
  );
}

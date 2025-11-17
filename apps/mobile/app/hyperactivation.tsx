import Screen from "./components/Screen";

const symptoms = [
  "Rythme cardiaque rapide, hypervigilance",
  "Agitation, irritabilité, respiration rapide",
  "Tensions, sueurs, palpitations, anxiété"
];

const actions = [
  "Respire lentement et profondément (4-6-8)",
  "Bouge légèrement pour décharger (marche, étirements)",
  "Reviens à tes sens : 5 choses que tu vois, 4 que tu touches"
];

export default function Hyperactivation() {
  return (
    <Screen
      title="Hyperactivation"
      lead="Quand le corps réagit comme s’il y avait un danger."
      sections={[
        { title: "Ce que tu peux ressentir", items: symptoms },
        { title: "Premiers gestes suggérés", items: actions }
      ]}
    />
  );
}

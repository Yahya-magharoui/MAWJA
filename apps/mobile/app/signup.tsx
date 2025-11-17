import Screen from "./components/Screen";

const sections = [
  {
    title: "Inscription",
    paragraphs: ["Crée un compte pour sauvegarder tes objectifs, routines et historiques."]
  }
];

export default function Signup() {
  return <Screen title="Inscription" lead="Rejoins Mawja et garde tes données." sections={sections} />;
}

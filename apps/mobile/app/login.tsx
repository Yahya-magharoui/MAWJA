import Screen from "./components/Screen";

const sections = [
  {
    title: "Connexion",
    paragraphs: ["Renseigne tes identifiants pour retrouver ton espace et ton plan."]
  }
];

export default function Login() {
  return <Screen title="Connexion" lead="Accède à ton compte Mawja." sections={sections} />;
}

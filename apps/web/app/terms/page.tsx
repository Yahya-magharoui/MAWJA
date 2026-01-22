'use client';

import Link from 'next/link';
import BackLink from '../../components/BackLink';

export default function TermsPage() {
  return (
    <main style={page}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <BackLink href="/" style={{ background: 'transparent', color: '#111' }} />
      </div>
      <section style={card}>
        <h1 style={title}>Conditions générales d’utilisation</h1>

        <p>
          Kalima est éditée par le Dr Kalyma (psychiatre). En utilisant l’application, vous acceptez les présentes
          conditions ainsi que la <Link href="/privacy" style={link}>Politique de confidentialité</Link>.
        </p>

        <h2 style={subtitle}>Objet du service</h2>
        <p>
          Kalima propose des outils de psychoéducation, des exercices de régulation émotionnelle et un espace pour
          rédiger des notes personnelles. Le service n’est pas un dispositif médical et ne remplace pas un suivi
          thérapeutique. En cas de détresse, contactez les services d’urgence.
        </p>

        <h2 style={subtitle}>Création et gestion du compte</h2>
        <p>
          L’ouverture d’un compte nécessite une adresse e-mail valide et un mot de passe. Vous êtes responsable
          de la confidentialité de vos identifiants et des actions réalisées via votre compte. En cas de suspicion
          d’usage frauduleux, signalez-le au plus vite.
        </p>

        <h2 style={subtitle}>Règles d’usage</h2>
        <ul style={list}>
          <li>Utiliser Kalima dans le respect des lois et des droits d’autrui.</li>
          <li>Ne pas publier d’informations diffamatoires, menaçantes ou illégales.</li>
          <li>Ne pas altérer le fonctionnement de la plateforme ni tenter d’accéder aux données d’autres utilisateurs.</li>
        </ul>

        <h2 style={subtitle}>Disponibilité du service</h2>
        <p>
          Nous fournissons Kalima 24h/24 sous réserve d’opérations de maintenance. Des évolutions techniques peuvent
          être déployées sans préavis, mais nous nous engageons à préserver la continuité et la sécurité des données.
        </p>

        <h2 style={subtitle}>Responsabilité</h2>
        <p>
          L’application est fournie « en l’état ». Le Dr Kalyma ne peut être tenu responsable d’un usage inapproprié
          ni des conséquences liées à l’absence de suivi médical personnalisé. Les informations proposées sont des
          outils d’accompagnement et ne constituent pas un avis médical.
        </p>

        <h2 style={subtitle}>Propriété intellectuelle</h2>
        <p>
          Les contenus, logos, graphismes, textes et fonctionnalités sont protégés par le droit d’auteur. Toute
          reproduction ou diffusion non autorisée est interdite.
        </p>

        <h2 style={subtitle}>Résiliation</h2>
        <p>
          Vous pouvez clôturer votre compte à tout moment via les paramètres ou en écrivant à
          <a href="mailto:support@kalima.app"> support@kalima.app</a>. Nous nous réservons le droit de suspendre un
          compte en cas de non-respect des CGU.
        </p>

      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#F6F7FE',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '40px 20px',
  fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  color: '#0f172a',
  position: 'relative',
};

const card: React.CSSProperties = {
  maxWidth: 760,
  width: '100%',
  background: '#fff',
  borderRadius: 20,
  padding: '32px 28px',
  boxShadow: '0 12px 28px rgba(15,23,42,.08)',
  border: '1px solid rgba(15,23,42,.08)',
  lineHeight: 1.45,
};

const title: React.CSSProperties = { fontSize: 26, marginBottom: 12 };
const subtitle: React.CSSProperties = { fontSize: 18, marginTop: 18, marginBottom: 6 };
const list: React.CSSProperties = { paddingLeft: 20, marginTop: 6 };
const link: React.CSSProperties = { color: '#4f46e5', fontWeight: 600 };

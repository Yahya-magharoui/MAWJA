'use client';

import Link from 'next/link';
import BackLink from '../../components/BackLink';

export default function PrivacyPage() {
  return (
    <main style={page}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <BackLink href="/" style={{ background: 'transparent', color: '#111' }} />
      </div>
      <section style={card}>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Politique de confidentialité</h1>
        <p style={{ marginBottom: 10 }}>
          Kalima est éditée par le Dr Kalyma (psychiatre). Contact : <a href="mailto:support@kalima.app">support@kalima.app</a>.
          Les données sont hébergées dans l’Union Européenne et font l’objet d’une protection conforme au RGPD.
        </p>
        <h2 style={subtitle}>Données collectées</h2>
        <p>Nous recueillons uniquement les informations nécessaires à l’accompagnement :</p>
        <ul style={list}>
          <li>Adresse e-mail et mot de passe pour la création de compte et la connexion sécurisée.</li>
          <li>Préférences locales (thème, exercices favoris, notes) stockées sur votre appareil.</li>
          <li>Éventuelles entrées personnelles (journal émotionnel, routines) que vous saisissez volontairement.</li>
        </ul>

        <h2 style={subtitle}>Pourquoi ces données ?</h2>
        <p>
          Base légale : exécution du service et consentement explicite de l’utilisateur. Les informations sont utilisées pour :
        </p>
        <ul style={list}>
          <li>Authentifier votre accès, synchroniser vos exercices et enregistrer vos progrès.</li>
          <li>Personnaliser votre parcours bien-être.</li>
          <li>Assurer la stabilité et la sécurité de la plateforme.</li>
        </ul>

        <h2 style={subtitle}>Partage et conservation</h2>
        <p>
          Les données ne sont jamais vendues ni communiquées à des tiers non autorisés. Elles peuvent être traitées
          par des sous-traitants techniques (hébergeur, service d’e-mail) soumis à des clauses de confidentialité.
          Elles sont conservées tant que votre compte reste actif ; en cas d’inactivité prolongée ou sur demande,
          les informations sont archivées puis supprimées de manière sécurisée.
        </p>

        <h2 style={subtitle}>Vos droits (RGPD)</h2>
        <p>
          Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité.
          Pour exercer ces droits ou retirer votre consentement, envoyez une demande à
          <a href="mailto:support@kalima.app"> support@kalima.app</a> depuis l’adresse liée à votre compte.
          Votre requête sera traitée sous 30 jours.
        </p>

        <h2 style={subtitle}>Sécurité et responsabilité médicale</h2>
        <p>
          Kalima n’est pas un dispositif médical et ne remplace pas une consultation individuelle avec un médecin
          ou un psychologue. En cas d’urgence ou de risque immédiat, contactez les services adaptés (SOS, SAMU, etc.).
          Des mesures techniques (chiffrement TLS, contrôle d’accès) protègent vos informations.
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
  maxWidth: 720,
  width: '100%',
  background: '#fff',
  borderRadius: 20,
  padding: '32px 28px',
  boxShadow: '0 12px 28px rgba(15,23,42,.08)',
  border: '1px solid rgba(15,23,42,.08)',
};

const list: React.CSSProperties = {
  paddingLeft: 20,
  marginTop: 8,
  lineHeight: 1.45,
};

const subtitle: React.CSSProperties = {
  fontSize: 18,
  marginTop: 18,
  marginBottom: 8,
};

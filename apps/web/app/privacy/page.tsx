'use client';

import BackLink from '../../components/BackLink';

export default function PrivacyPage() {
  return (
    <main style={page}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <BackLink href="/" style={{ background: 'transparent', color: '#111' }} />
      </div>
      <section style={card}>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Politique de confidentialité</h1>
        <p style={updatedAt}>Dernière mise à jour : 23 août 2026</p>
        <p style={{ marginBottom: 10 }}>
          Kalymap est éditée par Dr Yasmine Bendani. Contact : <a href="mailto:contact@kalymap.fr">contact@kalymap.fr</a>.
          Les données sont hébergées via des prestataires techniques et font l’objet de mesures destinées à en assurer
          la confidentialité, l’intégrité et la disponibilité.
        </p>
        <h2 style={subtitle}>Données collectées</h2>
        <p>Nous recueillons les informations nécessaires au fonctionnement de l’application :</p>
        <ul style={list}>
          <li>Adresse e-mail, nom éventuel, mot de passe conservé sous forme hachée et informations de session pour la création de compte et la connexion.</li>
          <li>Contenus saisis volontairement : notes, objectifs, favoris, historique d’utilisation et états émotionnels si vous les renseignez.</li>
          <li>Préférences locales ou techniques stockées sur votre appareil, comme certains réglages d’interface.</li>
          <li>Données techniques nécessaires à la sécurité et au fonctionnement, notamment le cookie d’authentification et les données utilisées pour limiter les requêtes abusives.</li>
        </ul>

        <h2 style={subtitle}>Finalités et bases légales</h2>
        <p>
          Les informations sont traitées principalement pour exécuter le service demandé, sécuriser la plateforme et gérer
          la relation avec l’utilisateur. Elles sont utilisées pour :
        </p>
        <ul style={list}>
          <li>Créer et administrer votre compte, vous authentifier et vous permettre d’utiliser Kalymap.</li>
          <li>Enregistrer vos données d’accompagnement, votre routine et certains éléments de suivi si vous choisissez de les renseigner.</li>
          <li>Assurer la stabilité, la maintenance, la sécurité et la prévention des abus.</li>
          <li>Envoyer des e-mails techniques liés au compte, notamment l’activation ou la réinitialisation du mot de passe lorsque ces fonctions sont activées.</li>
        </ul>

        <h2 style={subtitle}>Prestataires techniques</h2>
        <p>
          Les données ne sont pas vendues. Elles peuvent être traitées uniquement pour fournir le service par Supabase
          (base de données), Railway (API), Vercel (application web) et Resend (e-mails d’activation et de réinitialisation).
          Ces prestataires agissent dans le cadre de leurs services techniques respectifs.
        </p>

        <h2 style={subtitle}>Durées de conservation</h2>
        <ul style={list}>
          <li>Les données du compte et les contenus associés sont conservés tant que le compte existe.</li>
          <li>Une demande d’inscription non finalisée expire après 24 heures par défaut.</li>
          <li>Une demande de réinitialisation du mot de passe expire après 2 heures par défaut.</li>
          <li>Les demandes expirées sont supprimées automatiquement au démarrage du serveur puis périodiquement, toutes les 6 heures par défaut.</li>
          <li>Les jetons déjà utilisés peuvent être conservés jusqu’à 24 heures afin de détecter leur réutilisation, puis sont supprimés automatiquement.</li>
          <li>Les préférences enregistrées uniquement dans le navigateur restent présentes jusqu’à leur effacement depuis le navigateur ou la suppression de ses données locales.</li>
        </ul>

        <h2 style={subtitle}>Export et suppression du compte</h2>
        <p>
          Un utilisateur connecté peut, depuis les paramètres, télécharger un export JSON de son profil et de ses
          données associées : historique, activités, objectifs, notes et favoris. Le mot de passe, les cookies et les jetons
          de sécurité ne figurent pas dans cet export.
        </p>
        <p>
          Un utilisateur connecté peut également supprimer définitivement son compte depuis les paramètres après une
          confirmation explicite. Cette opération supprime le compte, le profil utilisateur et les historiques, activités,
          objectifs, notes, favoris et demandes temporaires qui lui sont associés. Elle est irréversible.
        </p>

        <h2 style={subtitle}>Vos autres droits (RGPD)</h2>
        <p>
          Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité.
          L’export et l’effacement sont accessibles directement dans les paramètres du compte utilisateur. Pour toute autre
          demande, difficulté ou exercice d’un droit qui ne serait pas disponible dans l’application, écrivez à
          <a href="mailto:contact@kalymap.fr"> contact@kalymap.fr</a> depuis l’adresse liée à votre compte.
          Vous disposez également du droit de saisir l’autorité de contrôle compétente.
        </p>

        <h2 style={subtitle}>Données sensibles, sécurité et responsabilité</h2>
        <p>
          Kalymap n’est pas un dispositif médical et ne remplace pas une consultation individuelle avec un médecin
          ou un psychologue. Certaines informations que vous saisissez peuvent révéler des éléments très personnels relatifs
          à votre bien-être émotionnel ou psychique. Nous recommandons donc de ne renseigner que les informations nécessaires
          à votre usage. Des mesures techniques et organisationnelles sont mises en place pour protéger les informations, sans
          qu’aucun dispositif ne puisse garantir un risque nul. En cas d’urgence ou de danger immédiat, contactez les numéros
          d’urgence, SOS Amitié, le 3114 ou un professionnel adapté.
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

const updatedAt: React.CSSProperties = {
  margin: '-4px 0 18px',
  color: '#64748b',
  fontSize: 13,
};

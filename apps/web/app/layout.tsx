import StateCheckinPrompt from "../components/StateCheckinPrompt";
import SettingsNavigationBridge from "../components/SettingsNavigationBridge";
import AppSplashScreen, { SplashBootstrapScript } from "../components/splash/AppSplashScreen";
import { ThemeBootstrapScript, ThemeColorSync } from "../components/theme";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

const siteDescription = "Kalymap est une application de santé mentale dédiée à la régulation émotionnelle, fondée sur le concept de la fenêtre de tolérance et proposant des exercices adaptés à l’état du moment.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kalymap.com"),
  title: "Kalymap | Régulation émotionnelle & fenêtre de tolérance",
  description: siteDescription,
  alternates: {
    canonical: "https://kalymap.com/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Kalymap",
    url: "https://kalymap.com/",
    title: "Kalymap | Régulation émotionnelle",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "Kalymap | Régulation émotionnelle",
    description: siteDescription,
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8eff1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get("x-nonce") ?? undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Kalymap",
    url: "https://kalymap.com",
    applicationCategory: "HealthApplication",
    description: "Application de santé mentale dédiée à la régulation émotionnelle et fondée sur le concept de la fenêtre de tolérance.",
  };

  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "var(--splash-background)" }}>
        <style>{globalStyles}</style>
        <ThemeBootstrapScript nonce={nonce} />
        <SplashBootstrapScript nonce={nonce} />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeColorSync />
        <AppSplashScreen />
        <SettingsNavigationBridge />
        {children}
        <StateCheckinPrompt />
      </body>
    </html>
  );
}

const globalStyles = `
  :root {
    --splash-background: #f8eff1;
  }

  html,
  body {
    width: 100%;
    max-width: 100%;
    overflow-x: clip;
    background: var(--splash-background);
  }

  body {
    min-height: 100dvh;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  img,
  svg,
  canvas {
    max-width: 100%;
  }
`;

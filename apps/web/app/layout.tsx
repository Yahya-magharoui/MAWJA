import StateCheckinPrompt from "../components/StateCheckinPrompt";
import AppSplashScreen, { SplashBootstrapScript } from "../components/splash/AppSplashScreen";
import { ThemeBootstrapScript, ThemeColorSync } from "../components/theme";
import type { Viewport } from "next";

export const metadata = { title: "Kalymap", description: "Fenêtre de tolérance" }
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8eff1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "var(--splash-background)" }}>
        <style>{globalStyles}</style>
        <ThemeBootstrapScript />
        <SplashBootstrapScript />
        <ThemeColorSync />
        <AppSplashScreen />
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

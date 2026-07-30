import { ThemeBootstrapScript, ThemeColorSync } from "../components/theme";
import StateCheckinPrompt from "../components/StateCheckinPrompt";
import type { Viewport } from "next";

export const metadata = { title: "Kalymap", description: "Fenêtre de tolérance" }
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <style>{globalStyles}</style>
        <ThemeBootstrapScript />
        <ThemeColorSync />
        {children}
        <StateCheckinPrompt />
      </body>
    </html>
  );
}

const globalStyles = `
  html,
  body {
    width: 100%;
    max-width: 100%;
    overflow-x: clip;
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

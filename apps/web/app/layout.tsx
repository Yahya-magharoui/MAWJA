import { ThemeBootstrapScript, ThemeColorSync } from "../components/theme";

export const metadata = { title: "Galíni", description: "Fenêtre de tolérance" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <ThemeBootstrapScript />
        <ThemeColorSync />
        {children}
      </body>
    </html>
  );
}

import { useMemo, useState } from "react";
import { Link } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView
} from "react-native";

const PRESET = ["#A78BFA", "#93C5FD", "#A7F3D0", "#FDE68A", "#F9A8D4", "#D1D5DB"];
const NAV_LINKS = [
  { href: "/home", label: "Accueil détaillé" },
  { href: "/app", label: "Espace Mawja" },
  { href: "/plan", label: "Plan personnalisé" },
  { href: "/history", label: "Historique" },
  { href: "/health", label: "Conseils santé" },
  { href: "/sos", label: "SOS" },
  { href: "/login", label: "Connexion" },
  { href: "/signup", label: "Inscription" },
  { href: "/exercice", label: "Exercices" }
];

export default function Index() {
  const [color, setColor] = useState("#A78BFA");

  const theme = useMemo(() => {
    // small helper to softly lighten hex colors
    const tint = (hex: string, t: number) => {
      const h = hex.replace("#", "");
      const to = (i: number) => parseInt(h.slice(i, i + 2), 16);
      const mix = (c: number) => Math.round(c + (255 - c) * t);
      const [r, g, b] = [0, 2, 4].map(to);
      return (
        "#" +
        [mix(r), mix(g), mix(b)]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("")
      );
    };
    return {
      hyper: tint(color, 0.1),
      window: tint(color, 0.18),
      hypo: tint(color, 0.24)
    };
  }, [color]);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View />
          <Text style={styles.title}>Comment te sens-tu ?</Text>
          <Text accessibilityRole="text" style={styles.gear}>
            ⚙️
          </Text>
        </View>

        <View style={styles.stack}>
          <Link href="/hyperactivation" asChild>
            <Pressable style={[styles.card, styles.top, { backgroundColor: theme.hyper }]}>
              <Text style={styles.cardTitle}>Hyperactivation</Text>
              <Text style={styles.cardCaption}>rythme élevé, agitation</Text>
            </Pressable>
          </Link>

          <Link href="/tolerance" asChild>
            <Pressable style={[styles.card, { backgroundColor: theme.window }]}>
              <Text style={styles.cardTitle}>Fenêtre de tolérance</Text>
              <Text style={styles.cardCaption}>zone d’équilibre</Text>
            </Pressable>
          </Link>

          <Link href="/hypoactivation" asChild>
            <Pressable style={[styles.card, styles.bottom, { backgroundColor: theme.hypo }]}>
              <Text style={styles.cardTitle}>Hypoactivation</Text>
              <Text style={styles.cardCaption}>ralentissement, fatigue</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.actions}>
          <Link href="/emergency" asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>J’ai besoin d’aide</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.subtle}>Couleur du thème</Text>
          <View style={styles.bubbles}>
            {PRESET.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Choisir ${c}`}
                style={[
                  styles.bubble,
                  { backgroundColor: c, borderWidth: color === c ? 2 : 0.5 }
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.navList}>
          <Text style={styles.subtle}>Navigation</Text>
          <View style={styles.navGrid}>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} asChild>
                <Pressable style={styles.navBtn}>
                  <Text style={styles.navBtnText}>{link.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F6F7FE"
  },
  scroll: {
    padding: 20,
    gap: 18
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1
  },
  gear: {
    fontSize: 18,
    width: 28,
    textAlign: "right"
  },
  stack: {
    gap: 14
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#00000010"
  },
  top: {
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120
  },
  bottom: {
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  cardCaption: {
    marginTop: 6,
    opacity: 0.7,
    fontSize: 13
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  secondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center"
  },
  secondaryText: {
    fontWeight: "600",
    color: "#0f172a"
  },
  footer: {
    gap: 8
  },
  subtle: { opacity: 0.6 },
  bubbles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: "#11111122"
  },
  navList: { marginTop: 6, gap: 8 },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  navBtnText: {
    fontWeight: "600"
  }
});

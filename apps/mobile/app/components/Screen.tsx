import React from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from "react-native";
import BackLink from "./BackLink";

type Section = {
  title: string;
  items?: string[];
  paragraphs?: string[];
};

type Props = {
  title: string;
  lead?: string;
  sections?: Section[];
  actions?: React.ReactNode;
  showBack?: boolean;
};

export default function Screen({
  title,
  lead,
  sections = [],
  actions,
  showBack = true
}: Props) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {showBack ? <BackLink label="Retour" /> : null}
        <Text style={styles.h1}>{title}</Text>
        {lead ? <Text style={styles.lead}>{lead}</Text> : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((p, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {p}
              </Text>
            ))}
            {section.items?.map((item) => (
              <Text key={item} style={styles.item}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        {actions}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F7FE" },
  scroll: { padding: 20, gap: 16 },
  h1: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  lead: { marginTop: 6, opacity: 0.7, fontSize: 15, lineHeight: 22 },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  paragraph: { fontSize: 14, lineHeight: 20 },
  item: { fontSize: 14, lineHeight: 20 }
});

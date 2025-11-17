import Screen from "./components/Screen";
import { View, Text, StyleSheet } from "react-native";

const contacts = [
  { label: "Urgences", value: "15" },
  { label: "Samu Social", value: "115" },
  { label: "Prévention suicide", value: "3114" }
];

export default function Emergency() {
  return (
    <Screen
      title="Numéros d’urgence"
      lead="Contacts utiles en cas de crise."
      sections={[
        {
          title: "Contacts",
          paragraphs: [],
          items: []
        }
      ]}
      actions={
        <View style={styles.section}>
          {contacts.map((c) => (
            <View key={c.value} style={styles.row}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.number}>{c.value}</Text>
            </View>
          ))}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
    marginTop: 8
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 15, fontWeight: "600" },
  number: { fontSize: 16, fontWeight: "700" }
});

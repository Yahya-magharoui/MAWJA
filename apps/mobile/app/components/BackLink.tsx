import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export default function BackLink({ label = "Retour" }: { label?: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={{ padding: 8, borderRadius: 8 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 20, color: "#111" }}>←</Text>
    </Pressable>
  );
}

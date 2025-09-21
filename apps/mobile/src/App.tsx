import { StatusBar } from 'expo-status-bar';
import { Text, View, Pressable } from 'react-native';

export default function App() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap: 16 }}>
      <Text style={{ fontSize: 20 }}>Galíni — fenêtre de tolérance</Text>
      <Pressable onPress={() => {}} style={{ padding:12, borderRadius:12, borderWidth:1 }}>
        <Text>Commencer</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

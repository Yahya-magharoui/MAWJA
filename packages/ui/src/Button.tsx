import { Pressable, Text } from 'react-native';
type Props = { title: string; onPress?: () => void };
export function Button({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{ padding:12, borderRadius:12, borderWidth:1 }}>
      <Text>{title}</Text>
    </Pressable>
  );
}

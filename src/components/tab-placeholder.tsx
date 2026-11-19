
import { Text, View } from "react-native";

type Props = {
  title: string;
  description: string;
};

export default function TabPlaceholder({
  title,
  description,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-3xl font-bold text-slate-900">
        {title}
      </Text>

      <Text className="mt-3 text-center text-base text-slate-500">
        {description}
      </Text>
    </View>
  );
}

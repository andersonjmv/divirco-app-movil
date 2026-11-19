
import { Text, View } from "react-native";

type Props = {
  title: string;
  description: string;
};

export function EmptyState({
  title,
  description,
}: Props) {
  return (
    <View className="items-center rounded-card border border-outline bg-white px-6 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-brand-light">
        <Text className="text-2xl text-brand">
          ◇
        </Text>
      </View>

      <Text className="text-center text-lg font-bold text-ink">
        {title}
      </Text>

      <Text className="mt-2 text-center text-sm leading-6 text-muted">
        {description}
      </Text>
    </View>
  );
}


import { Text, View } from "react-native";
import { AppButton } from "./app-button";

type Props = {
  title?: string;
  description: string;
  onRetry: () => void;
};

export function ErrorState({
  title = "Ocurrió un problema",
  description,
  onRetry,
}: Props) {
  return (
    <View className="gap-4 rounded-card border border-red-200 bg-white p-5">
      <View>
        <Text className="text-lg font-bold text-ink">
          {title}
        </Text>

        <Text className="mt-2 text-sm leading-6 text-muted">
          {description}
        </Text>
      </View>

      <AppButton
        title="Reintentar"
        onPress={onRetry}
        variant="secondary"
      />
    </View>
  );
}

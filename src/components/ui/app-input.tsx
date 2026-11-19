
import type { TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({
  label,
  error,
  ...props
}: Props) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-ink">
        {label}
      </Text>

      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#64748B"
        className={`min-h-12 rounded-2xl border bg-white px-4 text-base text-ink ${
          error
            ? "border-red-500"
            : "border-outline"
        }`}
      />

      {error ? (
        <Text className="text-sm text-red-600">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

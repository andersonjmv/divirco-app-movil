
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}: Props) {
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className={`min-h-12 items-center justify-center rounded-2xl px-5 ${
        primary ? "bg-brand" : "bg-brand-light"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Text
        className={`text-base font-semibold ${
          primary ? "text-white" : "text-brand"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}


import type { ReactNode } from "react";
import { View } from "react-native";

type Props = {
  children: ReactNode;
};

export function AppCard({ children }: Props) {
  return (
    <View className="rounded-card border border-outline bg-surface p-5">
      {children}
    </View>
  );
}

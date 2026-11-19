
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
};

export function ScreenContainer({
  children,
}: Props) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-canvas"
    >
      {children}
    </SafeAreaView>
  );
}

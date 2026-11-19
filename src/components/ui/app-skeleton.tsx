
import { View } from "react-native";

export function AppSkeleton() {
  return (
    <View
      accessibilityLabel="Cargando contenido"
      className="gap-4 rounded-card border border-outline bg-white p-5"
    >
      <View className="h-5 w-2/3 rounded-lg bg-slate-200" />
      <View className="h-4 w-full rounded-lg bg-slate-200" />
      <View className="h-4 w-4/5 rounded-lg bg-slate-200" />
      <View className="mt-2 h-12 rounded-2xl bg-slate-200" />
    </View>
  );
}

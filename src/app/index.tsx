
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <View className="rounded-3xl bg-violet-600 px-8 py-6">
        <Text className="text-center text-3xl font-bold text-white">
          DIVIRCO
        </Text>
        <Text className="mt-2 text-center text-base text-white">
          NativeWind funcionando
        </Text>
      </View>
    </View>
  );
}

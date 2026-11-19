
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="px-5 pb-10 pt-10"
    >
      <View className="mb-8">
        <Text className="text-sm font-semibold uppercase tracking-widest text-brand">
          DIVIRCO
        </Text>

        <Text className="mt-3 text-3xl font-bold text-ink">
          Descubre lo que tienes cerca
        </Text>

        <Text className="mt-3 text-base leading-6 text-muted">
          Explora negocios, lugares y servicios
          desde una sola aplicación.
        </Text>
      </View>

      <AppCard>
        <View className="mb-5">
          <Text className="text-xl font-bold text-ink">
            Explora tu ciudad
          </Text>

          <Text className="mt-2 text-sm leading-5 text-muted">
            Estamos preparando una nueva forma
            de descubrir establecimientos cercanos.
          </Text>
        </View>

        <AppButton
          title="Ir a Explorar"
          onPress={() => router.navigate("/explore")}
        />
      </AppCard>

      <View className="mt-8">
        <Text className="mb-4 text-lg font-bold text-ink">
          Descubre DIVIRCO
        </Text>

        <AppCard>
          <Text className="text-base font-semibold text-ink">
            Todo en un mismo lugar
          </Text>

          <Text className="mt-2 text-sm leading-6 text-muted">
            Próximamente encontrarás negocios,
            servicios y novedades de tu ciudad.
          </Text>
        </AppCard>
      </View>
    </ScrollView>
  );
}


import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 8;
const INITIAL_CITY = "Santa Marta";
const INITIAL_MUNICIPALITY = "47001";

type Business = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_verified: boolean | null;
  categories: {
    name: string;
  }[];
};

export default function HomeScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const mounted = useRef(true);
  const requestInProgress = useRef(false);
  const businessCount = useRef(0);

  const loadBusinesses = useCallback(
    async (reset = false) => {
      if (requestInProgress.current) return;

      requestInProgress.current = true;

      if (reset) {
        setLoading(true);
        setError("");
      } else {
        setLoadingMore(true);
      }

      try {
        const offset = reset ? 0 : businessCount.current;

        const { data, error: queryError } = await supabase
          .from("businesses")
          .select(`
            id,
            name,
            description,
            city,
            neighborhood,
            logo_url,
            cover_url,
            is_verified,
            categories (
              name
            )
          `)
          .eq("status", "published")
          .eq("municipality_code", INITIAL_MUNICIPALITY)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (queryError) {
          throw queryError;
        }

        if (!mounted.current) return;

        const incoming: Business[] = data ?? [];

        if (reset) {
          businessCount.current = incoming.length;
          setBusinesses(incoming);
        } else {
          businessCount.current += incoming.length;

          setBusinesses((current) => {
            const existing = new Set(
              current.map((business) => business.id)
            );

            return [
              ...current,
              ...incoming.filter(
                (business) => !existing.has(business.id)
              ),
            ];
          });
        }

        setHasMore(incoming.length === PAGE_SIZE);
        setError("");
      } catch {
        if (mounted.current) {
          setError(
            "No pudimos cargar los negocios. " +
              "Comprueba tu conexión e inténtalo nuevamente."
          );
        }
      } finally {
        requestInProgress.current = false;

        if (mounted.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mounted.current = true;

    void loadBusinesses(true);

    return () => {
      mounted.current = false;
    };
  }, [loadBusinesses]);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="gap-6 px-5 pb-12 pt-10"
    >
      {/* Encabezado */}

      <View className="gap-2">
        <Text className="text-sm font-bold uppercase tracking-widest text-brand">
          DIVIRCO
        </Text>

        <Text className="text-3xl font-bold text-ink">
          Descubre lo que tienes cerca
        </Text>

        <Text className="text-base leading-6 text-muted">
          Negocios y establecimientos de tu ciudad,
          conectados directamente con DIVIRCO.
        </Text>
      </View>

      {/* Ciudad */}

      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
            Explorando
          </Text>

          <Text className="text-xl font-bold text-ink">
            {INITIAL_CITY}
          </Text>
        </View>

        <View className="rounded-full bg-violet-100 px-4 py-2">
          <Text className="text-sm font-semibold text-brand">
            Negocios
          </Text>
        </View>
      </View>

      {/* Título de sección */}

      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-ink">
          Descubre negocios
        </Text>

        {!loading ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar negocios"
            onPress={() => void loadBusinesses(true)}
            className="rounded-full px-3 py-2"
          >
            <Text className="text-sm font-semibold text-brand">
              Actualizar
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Cargando */}

      {loading ? (
        <View className="items-center gap-4 py-12">
          <ActivityIndicator
            size="large"
            color="#4C22BD"
          />

          <Text className="text-sm text-muted">
            Descubriendo establecimientos...
          </Text>
        </View>
      ) : null}

      {/* Error inicial */}

      {!loading && error && businesses.length === 0 ? (
        <AppCard>
          <View className="items-center gap-4 py-6">
            <Text className="text-center text-base text-muted">
              {error}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => void loadBusinesses(true)}
              className="rounded-xl bg-brand px-5 py-3"
            >
              <Text className="font-semibold text-white">
                Reintentar
              </Text>
            </Pressable>
          </View>
        </AppCard>
      ) : null}

      {/* Estado vacío */}

      {!loading && !error && businesses.length === 0 ? (
        <AppCard>
          <View className="items-center gap-3 py-8">
            <Text className="text-lg font-bold text-ink">
              Tu ciudad está por descubrirse
            </Text>

            <Text className="text-center text-sm leading-6 text-muted">
              Todavía no hay establecimientos publicados
              disponibles en esta ciudad.
            </Text>
          </View>
        </AppCard>
      ) : null}

      {/* Negocios reales */}

      {!loading
        ? businesses.map((business) => {
            const imageUrl =
              business.cover_url || business.logo_url;

            const categoryName =
              business.categories?.[0]?.name ?? null;

            const location = [
              business.neighborhood,
              business.city,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <AppCard key={business.id}>
                <View className="gap-4">
                  {/* Imagen */}

                  {imageUrl ? (
                    <View className="overflow-hidden rounded-xl bg-violet-50">
                      <Image
                        source={{ uri: imageUrl }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                        style={{
                          width: "100%",
                          height: 180,
                        }}
                      />
                    </View>
                  ) : (
                    <View className="h-36 items-center justify-center rounded-xl bg-violet-50">
                      <Text className="text-4xl font-bold text-brand">
                        {business.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Nombre y categoría */}

                  <View className="gap-2">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-xl font-bold text-ink">
                        {business.name}
                      </Text>

                      {business.is_verified ? (
                        <View className="rounded-full bg-violet-100 px-2 py-1">
                          <Text className="text-xs font-semibold text-brand">
                            Verificado
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {categoryName ? (
                      <Text className="text-sm font-medium text-brand">
                        {categoryName}
                      </Text>
                    ) : null}

                    {location ? (
                      <Text className="text-sm text-muted">
                        {location}
                      </Text>
                    ) : null}

                    {business.description ? (
                      <Text
                        numberOfLines={3}
                        className="text-sm leading-6 text-muted"
                      >
                        {business.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </AppCard>
            );
          })
        : null}

      {/* Error al cargar más */}

      {!loading && businesses.length > 0 && error ? (
        <Text className="text-center text-sm text-red-600">
          {error}
        </Text>
      ) : null}

      {/* Paginación */}

      {!loading && businesses.length > 0 && hasMore ? (
        <Pressable
          accessibilityRole="button"
          disabled={loadingMore}
          onPress={() => void loadBusinesses(false)}
          className="items-center rounded-2xl border border-violet-200 bg-white px-5 py-4"
        >
          {loadingMore ? (
            <ActivityIndicator color="#4C22BD" />
          ) : (
            <Text className="font-bold text-brand">
              Ver más negocios
            </Text>
          )}
        </Pressable>
      ) : null}

      {!loading && businesses.length > 0 && !hasMore && !error ? (
        <Text className="py-3 text-center text-sm text-muted">
          Has visto todos los negocios disponibles.
        </Text>
      ) : null}
    </ScrollView>
  );
}

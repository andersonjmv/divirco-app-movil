
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { ScreenContainer } from "@/components/ui/screen-container";
import { supabase } from "@/lib/supabase";

type Profile = {
  display_name: string | null;
  city: string | null;
};

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;

      setUser(error ? null : data.user);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setMessage("No pudimos verificar la sesión.");
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      return;
    }

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, city")
        .eq("id", userId)
        .single();

      if (!active) return;

      if (error) {
        setMessage("No pudimos cargar el perfil.");
        return;
      }

      setProfile(data);
    }

    void loadProfile(user.id);

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function signIn() {
    if (busy) return;

    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Completa el correo y la contraseña.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage("No pudimos iniciar sesión. Revisa tus datos.");
      } else {
        setPassword("");
      }
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("No pudimos cerrar la sesión.");
      }
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5 pb-10 pt-8"
      >
        <View className="gap-2">
          <Text className="text-sm font-bold tracking-widest text-brand">
            DIVIRCO
          </Text>

          <Text className="text-3xl font-bold text-ink">
            {user ? "Mi perfil" : "Iniciar sesión"}
          </Text>

          <Text className="text-base text-muted">
            {user
              ? "Administra tu cuenta de DIVIRCO."
              : "Accede con tu cuenta existente."}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4C22BD" />
        ) : user ? (
          <AppCard>
            <View className="gap-4">
              <Text className="text-lg font-bold text-ink">
                {profile?.display_name || "Mi cuenta"}
              </Text>

              <Text className="text-sm text-muted">
                {user.email}
              </Text>

              {profile?.city ? (
                <Text className="text-sm text-muted">
                  Ciudad: {profile.city}
                </Text>
              ) : null}

              <AppButton
                title={busy ? "Cerrando sesión..." : "Cerrar sesión"}
                variant="secondary"
                onPress={signOut}
                disabled={busy}
              />
            </View>
          </AppCard>
        ) : (
          <AppCard>
            <View className="gap-4">
              <AppInput
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
              />

              <AppInput
                label="Contraseña"
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />

              <AppButton
                title={busy ? "Ingresando..." : "Iniciar sesión"}
                onPress={signIn}
                disabled={busy}
              />
            </View>
          </AppCard>
        )}

        {message ? (
          <Text accessibilityRole="alert" className="text-sm text-red-600">
            {message}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

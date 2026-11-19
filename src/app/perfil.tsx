
import type { User } from "@supabase/supabase-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { ScreenContainer } from "@/components/ui/screen-container";
import { supabase } from "@/lib/supabase";

const REDIRECT_URL = "divircoinicial://perfil";

type Profile = {
  display_name: string | null;
  city: string | null;
};

export default function PerfilScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const processedCode = useRef<string | null>(null);

  // Autenticación y perfil
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  // Formulario de acceso y registro
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Edición del perfil
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");

  // Mensajes
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================
  // VERIFICAR SESIÓN Y OBSERVAR AUTENTICACIÓN
  // ============================================

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;

        setUser(error ? null : data.user);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;

        setMessage("No pudimos verificar la sesión.");
        setLoading(false);
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setUser(session?.user ?? null);
        }
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // CONFIRMAR CORREO MEDIANTE PKCE
  // ============================================

  useEffect(() => {
    if (!code || processedCode.current === code) {
      return;
    }

    processedCode.current = code;

    let active = true;

    async function confirmEmail() {
      setLoading(true);
      setMessage("");
      setSuccess("");

      try {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code!);

        if (!active) return;

        if (error) {
          setMessage(
            "No pudimos confirmar el correo. " +
            "El enlace puede haber expirado."
          );
        } else {
          setSuccess("¡Correo confirmado correctamente!");
          setRegisterMode(false);
        }
      } catch {
        if (active) {
          setMessage("No pudimos completar la confirmación.");
        }
      } finally {
        if (active) {
          setLoading(false);
          router.replace("/perfil");
        }
      }
    }

    void confirmEmail();

    return () => {
      active = false;
    };
  }, [code, router]);

  // ============================================
  // CARGAR EL PERFIL DESDE SUPABASE
  // ============================================

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      setEditing(false);
      setEditName("");
      setEditCity("");
      return;
    }

    // Evitar mostrar los datos de una sesión anterior.
    setProfile(null);
    setEditing(false);

    async function loadProfile(userId: string) {
      try {
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
        setEditName(data.display_name ?? "");
        setEditCity(data.city ?? "");
      } catch {
        if (active) {
          setMessage("No pudimos conectar con el servicio.");
        }
      }
    }

    void loadProfile(user.id);

    return () => {
      active = false;
    };
  }, [user?.id]);

  // ============================================
  // INICIAR SESIÓN
  // ============================================

  async function signIn() {
    if (busy) return;

    setMessage("");
    setSuccess("");

    if (!email.trim() || !password) {
      setMessage("Completa el correo y la contraseña.");
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(
          "No pudimos iniciar sesión. " +
          "Revisa tus datos o confirma tu correo."
        );
        return;
      }

      setPassword("");
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // REGISTRAR USUARIO
  // ============================================

  async function signUp() {
    if (busy) return;

    setMessage("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setMessage("Introduce tu nombre.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage("Introduce un correo válido.");
      return;
    }

    if (password.length < 8) {
      setMessage(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: REDIRECT_URL,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        setMessage(
          "No pudimos procesar el registro. " +
          "Revisa tus datos e inténtalo más tarde."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");

      if (data.session) {
        setSuccess(
          "Cuenta creada. Ya puedes utilizar DIVIRCO."
        );
        setRegisterMode(false);
      } else {
        setSuccess(
          "Si el registro puede completarse, recibirás " +
          "un correo con las instrucciones de confirmación. " +
          "Revisa también la carpeta de spam."
        );
      }
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // CERRAR SESIÓN
  // ============================================

  async function signOut() {
    if (busy) return;

    setBusy(true);
    setMessage("");
    setSuccess("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("No pudimos cerrar la sesión.");
        return;
      }

      setProfile(null);
      setEditing(false);
      setPassword("");
      setConfirmPassword("");
      setRegisterMode(false);
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // GUARDAR CAMBIOS DEL PERFIL
  // ============================================

  async function saveProfile() {
    if (!user || !profile || busy) return;

    const cleanName = editName.trim();
    const cleanCity = editCity.trim();

    setMessage("");
    setSuccess("");

    if (cleanName.length < 2 || cleanName.length > 100) {
      setMessage(
        "El nombre debe tener entre 2 y 100 caracteres."
      );
      return;
    }

    if (cleanCity.length > 100) {
      setMessage(
        "La ciudad no puede superar 100 caracteres."
      );
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: cleanName,
          city: cleanCity || null,
        })
        .eq("id", user.id)
        .select("display_name, city")
        .single();

      if (error) {
        setMessage("No pudimos guardar los cambios.");
        return;
      }

      setProfile(data);
      setEditName(data.display_name ?? "");
      setEditCity(data.city ?? "");
      setEditing(false);

      setSuccess("Perfil actualizado correctamente.");
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // CANCELAR EDICIÓN
  // ============================================

  function cancelEditing() {
    if (busy) return;

    setEditName(profile?.display_name ?? "");
    setEditCity(profile?.city ?? "");
    setEditing(false);
    setMessage("");
    setSuccess("");
  }

  // ============================================
  // CAMBIAR ENTRE REGISTRO E INICIO DE SESIÓN
  // ============================================

  function switchMode() {
    if (busy) return;

    setRegisterMode(!registerMode);
    setMessage("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  }

  // ============================================
  // INTERFAZ
  // ============================================

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5 pb-10 pt-8"
      >
        {/* ENCABEZADO */}

        <View className="gap-2">
          <Text className="text-sm font-bold tracking-widest text-brand">
            DIVIRCO
          </Text>

          <Text className="text-3xl font-bold text-ink">
            {user
              ? "Mi perfil"
              : registerMode
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Text>

          <Text className="text-base leading-6 text-muted">
            {user
              ? "Administra tu cuenta de DIVIRCO."
              : registerMode
                ? "Regístrate para disfrutar de más funciones."
                : "Accede con tu cuenta existente."}
          </Text>
        </View>

        {/* CARGA INICIAL */}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4C22BD"
          />

        ) : user ? (

          /* PERFIL AUTENTICADO */

          <AppCard>
            <View className="gap-5">
              {editing ? (
                <>
                  <Text className="text-xl font-bold text-ink">
                    Editar perfil
                  </Text>

                  <AppInput
                    label="Nombre completo"
                    placeholder="Tu nombre"
                    value={editName}
                    onChangeText={setEditName}
                    autoComplete="name"
                    maxLength={100}
                  />

                  <AppInput
                    label="Ciudad"
                    placeholder="Tu ciudad"
                    value={editCity}
                    onChangeText={setEditCity}
                    autoCapitalize="words"
                    maxLength={100}
                  />

                  <AppButton
                    title={
                      busy
                        ? "Guardando..."
                        : "Guardar cambios"
                    }
                    onPress={saveProfile}
                    disabled={busy}
                  />

                  <AppButton
                    title="Cancelar"
                    variant="secondary"
                    onPress={cancelEditing}
                    disabled={busy}
                  />
                </>
              ) : (
                <>
                  <View className="gap-2">
                    <Text className="text-xl font-bold text-ink">
                      {profile?.display_name || "Mi cuenta"}
                    </Text>

                    <Text className="text-sm text-muted">
                      {user.email}
                    </Text>

                    <Text className="text-sm text-muted">
                      Ciudad: {profile?.city || "Sin configurar"}
                    </Text>
                  </View>

                  <AppButton
                    title="Editar perfil"
                    onPress={() => {
                      setMessage("");
                      setSuccess("");
                      setEditName(profile?.display_name ?? "");
                      setEditCity(profile?.city ?? "");
                      setEditing(true);
                    }}
                    disabled={!profile || busy}
                  />

                  <AppButton
                    title={
                      busy
                        ? "Cerrando sesión..."
                        : "Cerrar sesión"
                    }
                    variant="secondary"
                    onPress={signOut}
                    disabled={busy}
                  />
                </>
              )}
            </View>
          </AppCard>

        ) : (

          /* INICIO DE SESIÓN Y REGISTRO */

          <AppCard>
            <View className="gap-4">
              {registerMode ? (
                <AppInput
                  label="Nombre completo"
                  placeholder="Tu nombre"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  maxLength={100}
                />
              ) : null}

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
                autoComplete={
                  registerMode
                    ? "new-password"
                    : "current-password"
                }
              />

              {registerMode ? (
                <AppInput
                  label="Confirmar contraseña"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              ) : null}

              <AppButton
                title={
                  busy
                    ? "Procesando..."
                    : registerMode
                      ? "Crear cuenta"
                      : "Iniciar sesión"
                }
                onPress={
                  registerMode ? signUp : signIn
                }
                disabled={busy}
              />

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={switchMode}
                className="items-center py-3"
              >
                <Text className="text-center font-semibold text-brand">
                  {registerMode
                    ? "¿Ya tienes cuenta? Iniciar sesión"
                    : "¿No tienes cuenta? Regístrate"}
                </Text>
              </Pressable>
            </View>
          </AppCard>
        )}

        {/* MENSAJES DE ERROR */}

        {message ? (
          <Text
            accessibilityRole="alert"
            className="text-sm leading-5 text-red-600"
          >
            {message}
          </Text>
        ) : null}

        {/* MENSAJES DE ÉXITO */}

        {success ? (
          <Text
            accessibilityRole="alert"
            className="text-sm leading-6 text-green-700"
          >
            {success}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

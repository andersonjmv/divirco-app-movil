
import type { User } from "@supabase/supabase-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const CONFIRM_URL = "divircoinicial://perfil";
const RECOVERY_URL = "divircoinicial://perfil?mode=recovery";

type ScreenMode = "login" | "signup" | "forgot" | "reset";

type Profile = {
  display_name: string | null;
  city: string | null;
};

export default function PerfilScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    code?: string;
    mode?: string;
  }>();

  const processedCode = useRef<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [screenMode, setScreenMode] =
    useState<ScreenMode>("login");

  // Acceso y registro
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Recuperación
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  // Edición
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");

  // Mensajes
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================
  // SESIÓN Y EVENTOS DE AUTENTICACIÓN
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
      supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;

        setUser(session?.user ?? null);

        if (event === "PASSWORD_RECOVERY") {
          setScreenMode("reset");
        }
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // ENLACES DE CONFIRMACIÓN Y RECUPERACIÓN
  // ============================================

  useEffect(() => {
    const code = params.code;

    if (!code || processedCode.current === code) {
      return;
    }

    processedCode.current = code;

    let active = true;

    async function processAuthLink() {
      setLoading(true);
      setMessage("");

      try {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code!);

        if (!active) return;

        if (error) {
          Alert.alert(
            "Enlace no válido",
            "No pudimos procesar el enlace. Puede haber expirado."
          );
          router.replace("/perfil");
          return;
        }

        if (params.mode === "recovery") {
          setScreenMode("reset");
          router.replace({
            pathname: "/perfil",
            params: { mode: "recovery" },
          });
        } else {
          setScreenMode("login");
          setSuccess("¡Correo confirmado correctamente!");
          router.replace("/perfil");
        }
      } catch {
        if (active) {
          Alert.alert(
            "Error",
            "No pudimos procesar el enlace."
          );
          router.replace("/perfil");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void processAuthLink();

    return () => {
      active = false;
    };
  }, [params.code, params.mode, router]);

  // Recuperar el formulario si la ruta se reconstruye.
  useEffect(() => {
    if (
      params.mode === "recovery" &&
      !params.code &&
      user
    ) {
      setScreenMode("reset");
    }
  }, [params.mode, params.code, user?.id]);

  // ============================================
  // CARGAR PERFIL
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
          "No pudimos iniciar sesión. Revisa tus datos."
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

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      setMessage("Introduce un nombre válido.");
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
          emailRedirectTo: CONFIRM_URL,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        setMessage("No pudimos procesar el registro.");
        return;
      }

      setPassword("");
      setConfirmPassword("");

      if (data.session) {
        setScreenMode("login");
        setSuccess("Cuenta creada correctamente.");
      } else {
        setSuccess(
          "Si el registro puede completarse, recibirás " +
          "instrucciones en tu correo electrónico."
        );
      }
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  // ============================================

  async function requestPasswordReset() {
    if (busy) return;

    setMessage("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage("Introduce un correo válido.");
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: RECOVERY_URL,
          }
        );

      if (error) {
        setMessage(
          "No pudimos procesar la solicitud. " +
          "Inténtalo nuevamente más tarde."
        );
        return;
      }

      setSuccess(
        "Si existe una cuenta asociada a ese correo, " +
        "recibirás instrucciones para recuperar tu contraseña."
      );
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // ESTABLECER NUEVA CONTRASEÑA
  // ============================================

  async function updatePassword() {
    if (busy) return;

    setMessage("");
    setSuccess("");

    if (newPassword.length < 8) {
      setMessage(
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(
          "No pudimos actualizar la contraseña."
        );
        return;
      }

      setNewPassword("");
      setConfirmNewPassword("");

      const { error: signOutError } =
        await supabase.auth.signOut({ scope: "local" });

      if (signOutError) {
        setMessage(
          "La contraseña cambió, pero no pudimos cerrar " +
          "la sesión local."
        );
        return;
      }

      setScreenMode("login");
      router.replace("/perfil");

      Alert.alert(
        "Contraseña actualizada",
        "Ya puedes iniciar sesión con tu nueva contraseña."
      );
    } catch {
      setMessage("No pudimos completar la operación.");
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
      setScreenMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("No pudimos conectar con el servicio.");
    } finally {
      setBusy(false);
    }
  }

  // ============================================
  // GUARDAR PERFIL
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

  function cancelEditing() {
    if (busy) return;

    setEditName(profile?.display_name ?? "");
    setEditCity(profile?.city ?? "");
    setEditing(false);
    setMessage("");
    setSuccess("");
  }

  // ============================================
  // CAMBIAR DE FORMULARIO
  // ============================================

  function changeMode(mode: ScreenMode) {
    if (busy) return;

    setScreenMode(mode);
    setMessage("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  }

  // ============================================
  // INTERFAZ
  // ============================================

  const isResetting = screenMode === "reset";

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
            {isResetting
              ? "Nueva contraseña"
              : user
                ? "Mi perfil"
                : screenMode === "signup"
                  ? "Crear cuenta"
                  : screenMode === "forgot"
                    ? "Recuperar contraseña"
                    : "Iniciar sesión"}
          </Text>

          <Text className="text-base leading-6 text-muted">
            {isResetting
              ? "Establece una nueva contraseña para tu cuenta."
              : user
                ? "Administra tu cuenta de DIVIRCO."
                : screenMode === "signup"
                  ? "Regístrate para disfrutar de más funciones."
                  : screenMode === "forgot"
                    ? "Te enviaremos instrucciones a tu correo."
                    : "Accede con tu cuenta existente."}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4C22BD"
          />
        ) : isResetting && user ? (
          // NUEVA CONTRASEÑA
          <AppCard>
            <View className="gap-4">
              <AppInput
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
              />

              <AppInput
                label="Confirmar nueva contraseña"
                placeholder="Repite tu contraseña"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                autoComplete="new-password"
              />

              <AppButton
                title={
                  busy
                    ? "Actualizando..."
                    : "Guardar nueva contraseña"
                }
                onPress={updatePassword}
                disabled={busy}
              />
            </View>
          </AppCard>
        ) : user ? (
          // PERFIL AUTENTICADO
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
                    title={busy ? "Guardando..." : "Guardar cambios"}
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
        ) : screenMode === "forgot" ? (
          // SOLICITAR RECUPERACIÓN
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

              <AppButton
                title={
                  busy
                    ? "Enviando..."
                    : "Enviar instrucciones"
                }
                onPress={requestPasswordReset}
                disabled={busy}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => changeMode("login")}
                disabled={busy}
                className="items-center py-3"
              >
                <Text className="font-semibold text-brand">
                  Volver a iniciar sesión
                </Text>
              </Pressable>
            </View>
          </AppCard>
        ) : (
          // INICIAR SESIÓN O REGISTRARSE
          <AppCard>
            <View className="gap-4">
              {screenMode === "signup" ? (
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
                  screenMode === "signup"
                    ? "new-password"
                    : "current-password"
                }
              />

              {screenMode === "signup" ? (
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
                    : screenMode === "signup"
                      ? "Crear cuenta"
                      : "Iniciar sesión"
                }
                onPress={
                  screenMode === "signup" ? signUp : signIn
                }
                disabled={busy}
              />

              {screenMode === "login" ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => changeMode("forgot")}
                  className="items-center py-2"
                >
                  <Text className="font-semibold text-brand">
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() =>
                  changeMode(
                    screenMode === "signup"
                      ? "login"
                      : "signup"
                  )
                }
                className="items-center py-3"
              >
                <Text className="text-center font-semibold text-brand">
                  {screenMode === "signup"
                    ? "¿Ya tienes cuenta? Iniciar sesión"
                    : "¿No tienes cuenta? Regístrate"}
                </Text>
              </Pressable>
            </View>
          </AppCard>
        )}

        {message ? (
          <Text
            accessibilityRole="alert"
            className="text-sm leading-5 text-red-600"
          >
            {message}
          </Text>
        ) : null}

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

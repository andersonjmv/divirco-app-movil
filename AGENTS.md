# Reglas de rendimiento y arquitectura (proyecto Divirco app movil)

Eres un ingeniero senior de React Native con foco en fluidez. Meta: 60 FPS estables,
120 Hz donde el dispositivo lo permita. No uses APIs que no existan en las versiones
de abajo; si dudas de una API, dilo en vez de inventarla.

## Stack fijo
- Expo SDK 57 (expo ~57.0.33), React Native 0.86.3, React 19.2.3
- Expo Router ~57.0.31, Reanimated 4.5.1 (con react-native-worklets), FlashList 2.0.2
- TypeScript ~6.0.3 en modo estricto
- La Nueva Arquitectura es la única; no configures `newArchEnabled`.
- No modifiques `babel.config.js` ni `app.json` salvo que la documentación lo exija.

## Navegación
- Expo Router con stack nativo. Pestañas nativas desde `expo-router/unstable-native-tabs`
  (en SDK 58 cambia a `expo-router/native-tabs`; no uses esa ruta aquí).
- No uses React Navigation directo.

## Estilos
- NativeWind (`className`) para estilos estáticos. Estilos que cambian con animación:
  `useAnimatedStyle`. No mezcles con `StyleSheet` salvo caso justificado.

## Listas
- Feeds y listas dinámicas: `@shopify/flash-list` v2. No uses `estimatedItemSize`
  (está deprecado en v2).
- `getItemType` si hay varios tipos de tarjeta; `keyExtractor` con ids estables.
- Cada ítem es un componente aparte. `renderItem` definido fuera del render (el React
  Compiler gestiona la memoización automáticamente).
- Pagina siempre. `ScrollView` solo para contenido corto y fijo (ej. chips de filtro).

## Animaciones y gestos
- Reanimated con `useSharedValue` y `useAnimatedStyle`. Nada de `Animated` de React Native.
- Anima `transform` y `opacity`; evita animar `width`, `height` o `margin`.
- Gestos con `react-native-gesture-handler`. `runOnJS` solo cuando sea imprescindible.

## Imágenes
- Solo `expo-image` con `cachePolicy="memory-disk"` y `transition={200}`.
- Dimensiones explícitas en todo contenedor de imagen; miniaturas redimensionadas
  desde el servidor.

## Renders y trabajo pesado
- El React Compiler está activo: no uses `useMemo`, `useCallback` ni `React.memo`
  manualmente salvo que el Profiler muestre un problema real.
- Estado global con selectores para suscribirse solo a lo necesario.
- Trabajo pesado (filtrar, ordenar, parsear JSON grande): al servidor o paginado.
  Nunca en el render ni en el hilo JS.
- Evita jerarquías de `View` profundas y sombras o desenfoques costosos durante el scroll.

## Calidad
- Cada pantalla incluye estados de carga (esqueleto), vacío y error.
- Si una regla no se puede cumplir, dilo y explica por qué en vez de ignorarla.
- Indica cómo medir (modo release, Android de gama media, monitor de FPS de UI y de JS).
  No afirmes que algo "logra 60 FPS" sin medirlo.

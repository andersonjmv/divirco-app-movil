
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      tintColor="#4C22BD"
      indicatorColor="#F0EAFF"
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="explore" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="buscar">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="guardados">
        <NativeTabs.Trigger.Label>Guardados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

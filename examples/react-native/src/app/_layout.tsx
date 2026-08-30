import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout(): React.JSX.Element {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#f4f7f5" },
          headerShadowVisible: false,
          headerTintColor: "#173f34",
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: "#f4f7f5" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Field desk" }} />
        <Stack.Screen name="report" options={{ title: "New field report" }} />
        <Stack.Screen name="boundary" options={{ title: "Boundary lab" }} />
      </Stack>
    </>
  );
}

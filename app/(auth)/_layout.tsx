import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="login-select" />
      <Stack.Screen name="login-client" />
      <Stack.Screen name="login-barber" />
      <Stack.Screen name="register-client" />
      <Stack.Screen name="register-barber" />
      <Stack.Screen name="login" options={{ href: null }} />
      <Stack.Screen name="register" options={{ href: null }} />
    </Stack>
  );
}

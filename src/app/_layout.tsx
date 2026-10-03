import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "MyLibrary" }} />
      <Stack.Screen name="books/[id]" options={{ title: "Edit Book" }} />
    </Stack>
  );
}
import "../global.css";

import { Host } from "@expo/ui";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { Uniwind } from "uniwind";

import { useAppStore } from "../store/useAppStore";
import { useBusinessEventStore } from "../store/useBusinessEventStore";

export default function Layout() {
  const notificationSound = useAppStore((s) => s.notificationSound);
  const theme = useAppStore((s) => s.theme);
  const checkDueReminders = useBusinessEventStore((s) => s.checkDueReminders);
  const appState = useRef(AppState.currentState);

  // Restore persisted theme on app startup
  useEffect(() => {
    Uniwind.setTheme(theme);
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: notificationSound,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, [notificationSound]);

  // Re-schedule due event reminders on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        checkDueReminders();
      }
      appState.current = nextState;
    });
    // Also run on initial mount
    checkDueReminders();
    return () => sub.remove();
  }, [checkDueReminders]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | null;
      if (data?.type === "business_event_reminder") {
        router.push("/business-events");
      } else if (data?.phoneNumber) {
        const digits = `${data.countryCode ?? ""}${data.phoneNumber}`.replace(/\D/g, "");
        const msgParam = data.message ? `&text=${encodeURIComponent(data.message)}` : "";
        Linking.openURL(`whatsapp://send?phone=+${digits}${msgParam}`);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Host style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-white dark:bg-gray-950">
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "default",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Toast />
        </View>
      </GestureHandlerRootView>
    </Host>
  );
}

import { BlurTargetView } from "expo-blur";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Platform, View } from "react-native";

import { startAppLifecycle } from "../lib/app-lifecycle";
import { hydrateAppStore, useAppStore } from "../store/useAppStore";
import { CountryPickerSheet } from "../ui/country/country-picker-sheet";
import { FloatingTabBar } from "../ui/floating-tab-bar";
import { SplashScreen } from "../ui/splash-screen";
import { useTheme } from "../ui/theme";
import { ToastViewport } from "../ui/toast-viewport";

// Register the external notification handler once. It reads the current sound
// preference from the store when a notification arrives, so toggling the setting
// does not need to re-register it from an effect.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: useAppStore.getState().notificationSound,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, string> | null;
  if (data?.type === "business_event_reminder") {
    router.push("/business-events");
  } else if (data?.phoneNumber) {
    const digits = `${data.countryCode ?? ""}${data.phoneNumber}`.replace(/\D/g, "");
    const msgParam = data.message ? `&text=${encodeURIComponent(data.message)}` : "";
    Linking.openURL(`whatsapp://send?phone=+${digits}${msgParam}`);
  }
}

startAppLifecycle();

export default function Layout() {
  const { colors, isDark } = useTheme();
  const hydrated = useAppStore((state) => state.hydrated);
  // Static web rendering does not run effects, so it cannot wait on hydration.
  const appReady = hydrated || Platform.OS === "web";
  const pendingNotification = useRef<Notifications.NotificationResponse | null>(null);
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);
  const [minimumSplashDone, setMinimumSplashDone] = useState(false);

  useEffect(() => {
    void hydrateAppStore();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setMinimumSplashDone(true), 800);
    return () => clearTimeout(timeout);
  }, []);

  // Notifications can arrive while the hydration screen is up. Queue the
  // response until the navigator exists, then handle it.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!useAppStore.getState().hydrated) {
        pendingNotification.current = response;
        return;
      }
      handleNotificationResponse(response);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!appReady || !pendingNotification.current) return;
    const response = pendingNotification.current;
    pendingNotification.current = null;
    handleNotificationResponse(response);
  }, [appReady]);

  // Ask for notification permission once the UI exists. Requesting it from an
  // effect keeps it out of the startup critical path.
  useEffect(() => {
    if (!appReady) return;
    Notifications.requestPermissionsAsync().catch(() => {});
  }, [appReady]);

  if (!appReady || !minimumSplashDone) {
    return (
      <View style={{ flex: 1, backgroundColor: "#043D2C" }}>
        <StatusBar style="light" />
        <SplashScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "default",
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </BlurTargetView>
      <FloatingTabBar blurTarget={blurTargetRef} />
      <CountryPickerSheet />
      <ToastViewport />
    </View>
  );
}

"use client";

// ============================================================
// components/native-provider.js — Capacitor Init Wrapper
// ============================================================
// Wrap your app's root layout with this component.
// It handles: splash screen hiding, status bar theming,
// push notification registration, and app resume refresh.
//
// On the web (non-native), it renders children with no side effects.
// ============================================================

import { useEffect, useCallback } from "react";
import {
  isNative, hideSplash, setStatusBarDark,
  registerPushNotifications, setupAppStateListeners,
} from "@/lib/native";

export default function NativeProvider({ children }) {
  const init = useCallback(async () => {
    if (!isNative()) return;

    // 1. Hide splash screen once React has rendered
    await hideSplash();

    // 2. Set status bar to match our dark theme
    await setStatusBarDark();

    // 3. Register for push notifications
    await registerPushNotifications(
      // onTokenReceived — send this to your backend
      async (token) => {
        try {
          await fetch("/api/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, platform: "ios" }),
          });
        } catch (e) {
          console.warn("Failed to register push token:", e);
        }
      },
      // onNotificationReceived (foreground) — show an in-app alert
      (notification) => {
        // You could show a toast/banner here
        console.log("Foreground notification:", notification.title);
      }
    );

    // 4. Refresh data when app comes back from background
    await setupAppStateListeners(
      () => {
        // onResume — the user switched back to the app
        // Trigger a page refresh to get latest match status
        window.dispatchEvent(new CustomEvent("app-resumed"));
      },
      () => {
        // onPause — app went to background, nothing needed
      }
    );
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}

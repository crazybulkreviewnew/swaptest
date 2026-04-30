// ============================================================
// lib/native.js — Native Bridge (Capacitor)
// ============================================================
// Provides safe wrappers around Capacitor plugins.
// When running in a browser, all functions gracefully no-op.
// When running inside the iOS app, they use native APIs.
//
// USAGE:
//   import { isNative, hideSpash, vibrate } from "@/lib/native";
//   if (isNative()) { vibrate(); }
// ============================================================

// ── Detection ─────────────────────────────────────────────

export function isNative() {
  if (typeof window === "undefined") return false;
  return !!window.Capacitor?.isNativePlatform();
}

export function getPlatform() {
  if (typeof window === "undefined") return "web";
  return window.Capacitor?.getPlatform() || "web";
}

// ── Splash Screen ─────────────────────────────────────────
// Hide the native splash screen once the page has loaded.

export async function hideSplash() {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn("SplashScreen hide failed:", e);
  }
}

// ── Status Bar ────────────────────────────────────────────

export async function setStatusBarDark() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#111110" });
  } catch (e) {
    console.warn("StatusBar failed:", e);
  }
}

// ── Haptics ───────────────────────────────────────────────
// Light vibration on key actions (match found, payment confirmed)

export async function vibrate(style = "Medium") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle[style] || ImpactStyle.Medium });
  } catch (e) {
    console.warn("Haptics failed:", e);
  }
}

export async function vibrateSuccess() {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.warn("Haptics failed:", e);
  }
}

// ── Push Notifications ────────────────────────────────────
// Request permission and register for push notifications.
// Returns the device token (send this to your backend to store).

export async function registerPushNotifications(onTokenReceived, onNotificationReceived) {
  if (!isNative()) return null;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      console.log("Push permission denied");
      return null;
    }

    // Register with APNs
    await PushNotifications.register();

    // Listen for the device token
    PushNotifications.addListener("registration", (token) => {
      console.log("Push token:", token.value);
      onTokenReceived?.(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    // Listen for received notifications (app in foreground)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push received:", notification);
      onNotificationReceived?.(notification);
    });

    // Listen for notification taps (app opened from notification)
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Push action:", action);
      // Navigate to match page if the notification contains a matchId
      const matchId = action.notification?.data?.matchId;
      if (matchId) {
        window.location.href = `/match?id=${matchId}`;
      }
    });

    return true;
  } catch (e) {
    console.warn("Push notifications setup failed:", e);
    return null;
  }
}

// ── Keyboard ──────────────────────────────────────────────
// Listen for keyboard show/hide to adjust UI

export async function setupKeyboardListeners(onShow, onHide) {
  if (!isNative()) return;
  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", (info) => {
      onShow?.(info.keyboardHeight);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      onHide?.();
    });
  } catch (e) {
    console.warn("Keyboard listeners failed:", e);
  }
}

// ── App State ─────────────────────────────────────────────
// Detect when app goes to background/foreground

export async function setupAppStateListeners(onResume, onPause) {
  if (!isNative()) return;
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        onResume?.();
      } else {
        onPause?.();
      }
    });
  } catch (e) {
    console.warn("App state listeners failed:", e);
  }
}

// ── Open External URL ─────────────────────────────────────
// Opens a URL in the in-app browser (for links that shouldn't
// leave the app, like DVSA website)

export async function openExternal(url) {
  if (!isNative()) {
    window.open(url, "_blank");
    return;
  }
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch (e) {
    window.open(url, "_blank");
  }
}

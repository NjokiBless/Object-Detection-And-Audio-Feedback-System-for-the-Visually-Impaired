import React, { useEffect, useState, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { Modal, Portal, Text, Button, Card } from "react-native-paper";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const KEY_BIO_ENABLED = "auth:bio:enabled"; // same key you already use

type Props = {
  /** Optional: center modal on current screen */
  containerStyle?: any;
};

/**
 * Shows a blocking-ish modal asking the user to enable biometrics
 * every time the app opens or returns to foreground — UNTIL they accept.
 *
 * Once accepted, we persist KEY_BIO_ENABLED="1" and never show again.
 */
export default function BioOptInGate({ containerStyle }: Props) {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bioLabel, setBioLabel] = useState("Biometrics");

  const evaluate = useCallback(async () => {
    try {
      setChecking(true);

      const enabled = await SecureStore.getItemAsync(KEY_BIO_ENABLED);
      if (enabled === "1") {
        setVisible(false);
        setChecking(false);
        return;
      }

      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync(); // STRONG/WEAK/NONE
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!hasHw || enrolledLevel === LocalAuthentication.SecurityLevel.NONE || types.length === 0) {
        // No biometrics available/enrolled -> don’t show (we’ll re-check next time)
        setVisible(false);
        setChecking(false);
        return;
      }

      // Choose a friendly label
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBioLabel(Platform.OS === "ios" ? "Face ID" : "Face");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBioLabel(Platform.OS === "ios" ? "Touch ID" : "Fingerprint");
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBioLabel("Iris");
      } else {
        setBioLabel("Biometrics");
      }

      // If available and not enabled -> show nag
      setVisible(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // On mount
    evaluate();

    // Every time app returns to foreground
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") evaluate();
    });
    return () => sub.remove();
  }, [evaluate]);

  const accept = async () => {
    await SecureStore.setItemAsync(KEY_BIO_ENABLED, "1");
    setVisible(false);
    // (Optional) Immediate test auth to confirm biometric works:
    // const res = await LocalAuthentication.authenticateAsync({ promptMessage: `Use ${bioLabel}` });
  };

  // Intentionally NO "Don't ask again" to satisfy “until they accept”
  const maybeLater = () => {
    // Dismiss now; will re-appear on next app open/foreground
    setVisible(false);
  };

  // Don’t render anything while checking
  if (checking) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {}}
        contentContainerStyle={[
          {
            backgroundColor: "#0b1220",
            marginHorizontal: 20,
            borderRadius: 16,
          },
          containerStyle,
        ]}
      >
        <Card mode="elevated" style={{ backgroundColor: "#0b1220" }}>
          <Card.Title
            title="Enable quick login"
            subtitle={`Use ${bioLabel} to sign in faster and more securely.`}
            titleVariant="titleLarge"
            titleStyle={{ color: "#e2e8f0" }}
            subtitleStyle={{ color: "#94a3b8" }}
          />
          <Card.Content>
            <Text style={{ color: "#94a3b8", marginBottom: 16 }}>
              We’ll ask you for {bioLabel} next time you sign in. You can still use your
              email and password anytime.
            </Text>
            <Button mode="contained" onPress={accept} style={{ marginBottom: 8, borderRadius: 12 }}>
              Enable {bioLabel}
            </Button>
            <Button mode="text" onPress={maybeLater}>
              Not now
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

// vi-app/src/screens/SecurityScreen.tsx
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput, Button, Divider, Snackbar } from "react-native-paper";
import { securityApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SecurityScreen() {
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [loadingChange, setLoadingChange] = useState(false);
  const [loadingLogoutAll, setLoadingLogoutAll] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  const showSnack = (text: string) => setSnack({ visible: true, text });

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNew) {
      showSnack("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNew) {
      showSnack("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      showSnack("New password should be at least 6 characters.");
      return;
    }

    setLoadingChange(true);
    try {
      await securityApi.changePassword({ currentPassword, newPassword });
      showSnack("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Failed to change password.";
      showSnack(msg);
    } finally {
      setLoadingChange(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoadingLogoutAll(true);
    try {
      await securityApi.logoutAll();
      showSnack("Logged out from all devices.");
      // Also clear local auth state
      await logout();
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Failed to log out from all devices.";
      showSnack(msg);
    } finally {
      setLoadingLogoutAll(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Security
        </Text>
        <Text style={styles.subtitle}>
          Manage your account security and keep your access under control.
        </Text>

        <Divider style={styles.divider} />

        {/* Change password */}
        <Text style={styles.sectionTitle}>Change password</Text>
        <Text style={styles.sectionHint}>
          Choose a strong password that you don’t reuse on other apps.
        </Text>

        <TextInput
          label="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
          mode="outlined"
          outlineStyle={styles.inputOutline}
        />
        <TextInput
          label="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          mode="outlined"
          outlineStyle={styles.inputOutline}
        />
        <TextInput
          label="Confirm new password"
          secureTextEntry
          value={confirmNew}
          onChangeText={setConfirmNew}
          style={styles.input}
          mode="outlined"
          outlineStyle={styles.inputOutline}
        />

        <Button
          mode="contained"
          onPress={handleChangePassword}
          loading={loadingChange}
          style={styles.primaryButton}
        >
          Update password
        </Button>

        <Divider style={styles.divider} />

        {/* Logout all devices */}
        <Text style={styles.sectionTitle}>Log out from all devices</Text>
        <Text style={styles.sectionHint}>
          This will invalidate active sessions on other phones/tablets and sign you out everywhere.
        </Text>

        <Button
          mode="outlined"
          onPress={handleLogoutAll}
          loading={loadingLogoutAll}
          style={styles.dangerButton}
          textColor="#ef4444"
        >
          Logout everywhere
        </Button>

        <Text style={styles.smallHint}>
          Recommended if you think someone else might have access to your account.
        </Text>
      </ScrollView>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2500}
        style={{ backgroundColor: "#1f2937" }}
      >
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  title: { color: "#e2e8f0", marginBottom: 4 },
  subtitle: { color: "#94a3b8", marginBottom: 16 },
  divider: { backgroundColor: "#1f2937", marginVertical: 16 },
  sectionTitle: { color: "#e5e7eb", fontWeight: "600", marginBottom: 4 },
  sectionHint: { color: "#64748b", fontSize: 13, marginBottom: 8 },
  input: { marginTop: 10 },
  inputOutline: { borderRadius: 12, borderColor: "#1f2937" },
  primaryButton: { marginTop: 16, borderRadius: 12 },
  dangerButton: { marginTop: 10, borderRadius: 12, borderColor: "rgba(239,68,68,0.5)" },
  smallHint: { color: "#6b7280", fontSize: 12, marginTop: 8 },
});

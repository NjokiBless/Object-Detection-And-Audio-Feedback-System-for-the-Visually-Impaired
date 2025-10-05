// vi-mobile/vi-app/src/screens/OTPVerifyScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function OTPVerifyScreen({ route }: any) {
  const emailFromRoute = route?.params?.email || "";
  const { setUser, setToken } = useAuth();

  const [email, setEmail] = useState(emailFromRoute);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const verify = async () => {
    setBusy(true);
    setMsg("");
    try {
      const { data } = await authApi.post("/auth/login/verify", { email, otp });
      if (data?.ok && data?.access) {
        // Setting token triggers AppNavigator to switch to the protected stack.
        setToken(data.access);
        setUser({ email });
        // No manual navigation/reset needed.
      } else {
        setMsg("Invalid code");
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Verify failed");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setMsg("");
    try {
      await authApi.post("/auth/login/start", { email });
      setMsg("OTP re-sent");
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Resend failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Enter the code we sent</Text>
      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.in}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        mode="outlined"
        label="6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        style={styles.in}
        keyboardType="number-pad"
      />
      <Button mode="contained" onPress={verify} loading={busy} style={styles.btn}>
        Verify
      </Button>
      <Button mode="text" onPress={resend} disabled={busy}>
        Resend code
      </Button>
      {!!msg && <Text style={{ color: "#cbd5e1", marginTop: 8 }}>{msg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    paddingTop: 32,
  },
  h1: { color: "#fff", fontSize: 18, marginBottom: 12 },
  in: { width: "90%", marginBottom: 12, backgroundColor: "#fff" },
  btn: { width: "90%", marginTop: 4 },
});

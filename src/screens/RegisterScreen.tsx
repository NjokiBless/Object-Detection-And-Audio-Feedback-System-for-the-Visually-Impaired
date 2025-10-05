// vi-mobile/vi-app/src/screens/RegisterScreen.tsx
import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { authApi } from "../api/client";

// Normalize Kenyan numbers to +2547XXXXXXXX (optional; kept for profile)
function normalizeKe(raw: string): string {
  let s = (raw || "").replace(/[^\d+]/g, "");
  if (s.startsWith("00254")) s = "+254" + s.slice(5);
  if (s.startsWith("07")) s = "+254" + s.slice(1);
  else if (/^7\d{0,8}$/.test(s)) s = "+254" + s;
  else if (/^07\d{0,8}$/.test(s)) s = "+254" + s.slice(1);
  return s;
}
function looksLikeValidE164Ke(s: string): boolean {
  return /^\+2547\d{8}$/.test(s);
}

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onPhoneChange = (t: string) => setPhone(normalizeKe(t));

  const register = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (!email || !password) {
        setMsg("Email and password are required");
        return;
      }
      const safePhone = looksLikeValidE164Ke(phone) ? phone : undefined;

      await authApi.post("/auth/register", { email, phone: safePhone, password });
      await authApi.post("/auth/login/start", { email }); // email-only OTP
      navigation.navigate("OTPVerify", { email });
    } catch (e: any) {
      const m = e?.response?.data?.error || e?.message || "Register failed (network?)";
      setMsg(m);
      console.log("Register error:", m);
    } finally {
      setBusy(false);
    }
  };

  const phoneHelper =
    phone.length > 0 && !looksLikeValidE164Ke(phone)
      ? "Kenyan mobile will be formatted as +2547XXXXXXXX"
      : "";

  return (
    <View style={styles.wrap}>
      <Image source={require("../../assets/logo.png")} style={{ width: 72, height: 72, marginBottom: 12 }} />
      <Text variant="titleLarge" style={{ color: "#fff", marginBottom: 12 }}>
        Create your account
      </Text>

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
        label="Phone (+2547… or type 07…)"
        value={phone}
        onChangeText={onPhoneChange}
        style={styles.in}
        keyboardType="phone-pad"
        right={<TextInput.Affix text="🇰🇪" />}
      />
      {!!phoneHelper && <Text style={styles.helper}>{phoneHelper}</Text>}

      <TextInput
        mode="outlined"
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.in}
        secureTextEntry
      />

      <Button mode="contained" onPress={register} loading={busy} style={styles.btn}>
        Register
      </Button>

      {!!msg && <Text style={{ color: "#cbd5e1", marginTop: 8 }}>{msg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", paddingTop: 32, backgroundColor: "#0b1220" },
  in: { width: "90%", marginBottom: 12, backgroundColor: "#fff" },
  btn: { width: "90%", marginTop: 4 },
  helper: { width: "90%", color: "#cbd5e1", marginTop: -8, marginBottom: 8 },
});

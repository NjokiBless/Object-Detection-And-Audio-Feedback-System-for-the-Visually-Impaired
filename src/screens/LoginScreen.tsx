// vi-mobile/vi-app/src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Button, TextInput, Text } from "react-native-paper";

import { authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { setUser, setToken } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const login = async () => {
    const e = email.trim();
    const p = password;
    if (!e || !p) {
      setMsg("Email and password are required.");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const { data } = await authApi.post("/auth/login/password", {
        email: e,
        password: p,
      });

      if (data?.ok && data?.access) {
        // Setting token triggers AppNavigator to switch to the protected stack.
        setToken(data.access);
        setUser({ email: e });
      } else {
        setMsg("Invalid credentials.");
      }
    } catch (err: any) {
      const m =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Check your network.";
      setMsg(m);
      console.log("[AUTH] Login error:", m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 84, height: 84, marginBottom: 10, opacity: 0.9 }}
        />

        <Text style={styles.title}>Welcome back</Text>

        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          autoComplete="password"
        />

        <Button
          mode="contained"
          onPress={login}
          loading={busy}
          style={styles.button}
        >
          Sign in
        </Button>

        {!!msg && <Text style={styles.msg}>{msg}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1220" },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
    marginTop: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 10,
  },
  button: {
    width: "100%",
    marginTop: 6,
    borderRadius: 10,
  },
  msg: {
    color: "#cbd5e1",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});

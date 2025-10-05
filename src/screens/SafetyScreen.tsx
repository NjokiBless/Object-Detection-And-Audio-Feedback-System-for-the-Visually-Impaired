import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, Keyboard } from "react-native";
import { Button, Card, Text, TextInput, IconButton, Divider } from "react-native-paper";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import * as MailComposer from "expo-mail-composer";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { sosApi, profileApi } from "../api/client";

type EmergencyContact = { name?: string; email?: string; phone?: string };
const isEmail  = (s?: string) => !!String(s || "").match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const isPhone  = (s?: string) => !!String(s || "").match(/^\+?[1-9]\d{6,14}$/);

export default function SafetyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState<string>("");
  const [myPhone, setMyPhone]   = useState<string>("");
  const [list, setList] = useState<EmergencyContact[]>([{ name: "", email: "", phone: "" }]);
  const [busy, setBusy] = useState(false);

  const INPUT_PROPS = {
    textColor: "#e2e8f0" as const,
    placeholderTextColor: "#94a3b8",
    selectionColor: "#93c5fd",
    theme: { colors: { onSurface:"#e2e8f0", surface:"#0b1220", outline:"rgba(148,163,184,0.35)", placeholder:"#94a3b8" } },
    returnKeyType: "done" as const,
    blurOnSubmit: true,
    onSubmitEditing: () => Keyboard.dismiss(),
  };

  // Load profile (name/phone) + contacts
  useEffect(() => {
    (async () => {
      try {
        const [{ data: prof }, { data: con }] = await Promise.all([profileApi.get(), sosApi.getContacts()]);
        if (prof?.ok && prof.profile) {
          const p = prof.profile;
          setFullName(`${p.firstName || ""} ${p.lastName || ""}`.trim());
          setMyPhone(p.phone || "");
        }
        if (con?.ok && Array.isArray(con.contacts) && con.contacts.length) setList(con.contacts);
      } catch {}
    })();
  }, []);

  // Ask for location permission proactively
  useEffect(() => {
    (async () => {
      const fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const addContact    = () => setList((prev) => (prev.length < 3 ? [...prev, { name:"", email:"", phone:"" }] : prev));
  const removeContact = (idx: number) => setList((prev) => prev.filter((_, i) => i !== idx));
  const updateContact = (idx: number, patch: Partial<EmergencyContact>) =>
    setList((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const canAddMore = list.length < 3;

  // Save contacts + also persist name/phone to Users table via /profile
  const saveAll = async () => {
    const clean = list.slice(0,3).map((c)=>({
      name:(c.name||"").trim(), email:(c.email||"").trim(), phone:(c.phone||"").trim()
    })).filter((c)=>c.email || c.phone);

    for (const c of clean) {
      if (c.email && !isEmail(c.email)) return Alert.alert("Invalid email", c.email);
      if (c.phone && !isPhone(c.phone)) return Alert.alert("Invalid phone", c.phone);
    }

    const firstName = (fullName || "").trim().split(/\s+/)[0] || "";
    const lastName  = (fullName || "").trim().split(/\s+/).slice(1).join(" ");

    setBusy(true);
    try {
      try { await sosApi.saveContacts(clean); } catch {}
      try { await profileApi.update({ firstName, lastName, phone: myPhone }); } catch {}
      Alert.alert("Saved", "Emergency contacts and profile updated.");
    } finally {
      setBusy(false);
    }
  };

  const localMessage = useMemo(() => {
    const email = user?.email || "(No email)";
    const phone = myPhone?.trim() || "(No phone)";
    return `EMERGENCY: ${fullName || "(Name not set)"} is in danger.\nEmail: ${email}\nPhone: ${phone}`;
  }, [fullName, myPhone, user?.email]);

  const getLocationTextAndCoords = async (): Promise<{ text: string }> => {
    try {
      let fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted) return { text: "" };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;
      return { text: `\nLocation: https://maps.google.com/?q=${latitude},${longitude}` };
    } catch { return { text: "" }; }
  };

  const sendAll = async (mode: "sms" | "email" | "both" = "both") => {
    setBusy(true);
    try {
      const { text } = await getLocationTextAndCoords();
      const body = `${localMessage}${text}`;

      if (mode !== "email") {
        const avail = await SMS.isAvailableAsync();
        const phones = list.map((c)=>c.phone || "").filter(Boolean);
        if (avail && phones.length) await SMS.sendSMSAsync(phones as string[], body);
      }
      if (mode !== "sms") {
        const availM = await MailComposer.isAvailableAsync();
        const emails = list.map((c)=>c.email || "").filter(Boolean);
        if (availM && emails.length) await MailComposer.composeAsync({ recipients: emails, subject: "EMERGENCY: I need help", body });
      }
    } finally { setBusy(false); }
  };

  const sendSingle = async (c: EmergencyContact, mode: "sms" | "email") => {
    setBusy(true);
    try {
      const { text } = await getLocationTextAndCoords();
      const body = `${localMessage}${text}`;
      if (mode === "sms" && c.phone) {
        const avail = await SMS.isAvailableAsync();
        if (avail) await SMS.sendSMSAsync([c.phone], body);
      } else if (mode === "email" && c.email) {
        const availM = await MailComposer.isAvailableAsync();
        if (availM) await MailComposer.composeAsync({ recipients:[c.email], subject:"EMERGENCY: I need help", body });
      }
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text variant="titleLarge" style={styles.title}>Safety</Text>
        <Text style={styles.muted}>
          Add up to three emergency contacts. Your name & phone are shared with the Profile screen.
        </Text>

        <Card style={styles.card}>
          <Card.Title title="Your information" titleStyle={styles.cardTitle} />
          <Card.Content>
            <TextInput label="Full name" mode="outlined" value={fullName} style={styles.input}
              onChangeText={setFullName} {...INPUT_PROPS} />
            <TextInput label="Your phone (+254…)" mode="outlined" keyboardType="phone-pad"
              value={myPhone} style={styles.input} onChangeText={setMyPhone} {...INPUT_PROPS} />
            <Text style={styles.mutedSmall}>
              Email used: <Text style={{ color:"#cbd5e1" }}>{user?.email ?? "unknown"}</Text>
            </Text>
          </Card.Content>
        </Card>

        <Divider style={{ marginVertical: 12, backgroundColor: "#243044" }} />

        {list.map((c, idx) => (
          <Card key={idx} style={styles.card}>
            <Card.Title
              title={`Emergency contact ${idx + 1}`}
              titleStyle={styles.cardTitle}
              right={(props) =>
                list.length > 1 ? (
                  <IconButton {...props} icon="delete-outline" onPress={() => removeContact(idx)} />
                ) : null
              }
            />
            <Card.Content>
              <TextInput label="Name (optional)" mode="outlined" value={c.name || ""} style={styles.input}
                onChangeText={(t)=>updateContact(idx,{name:t})} {...INPUT_PROPS} />
              <TextInput label="Email" mode="outlined" keyboardType="email-address" autoCapitalize="none"
                value={c.email || ""} style={styles.input} onChangeText={(t)=>updateContact(idx,{email:t})} {...INPUT_PROPS} />
              <TextInput label="Phone" mode="outlined" keyboardType="phone-pad"
                value={c.phone || ""} style={styles.input} onChangeText={(t)=>updateContact(idx,{phone:t})} {...INPUT_PROPS} />
              <View style={styles.row}>
                <Button icon="email-outline" mode="contained" onPress={()=>sendSingle(c,"email")}
                  style={[styles.btn,{marginRight:6}]} disabled={!c.email} loading={busy}>Email</Button>
                <Button icon="message-text-outline" mode="contained-tonal" onPress={()=>sendSingle(c,"sms")}
                  style={[styles.btn,{marginLeft:6}]} disabled={!c.phone} loading={busy}>Text</Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        <View style={{ height: 8 }} />
        <View style={styles.row}>
          <Button
            icon="plus-circle-outline"
            mode="outlined"
            onPress={addContact}
            disabled={!canAddMore}
            style={[styles.btn,{marginRight:6}]}
          >
            Add contact
          </Button>
          <Button
            icon="content-save-outline"
            mode="contained"
            onPress={saveAll}
            style={[styles.btn,{marginLeft:6}]}
            loading={busy}
          >
            Save
          </Button>
        </View>

        <Divider style={{ marginVertical: 16, backgroundColor: "#243044" }} />

        <Card style={styles.card}>
          <Card.Title title="Quick SOS" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.row}>
              <Button icon="email-outline" mode="contained" style={[styles.btn,{marginRight:6}]} onPress={()=>sendAll("email")} loading={busy}>
                Email all
              </Button>
              <Button icon="message-text-outline" mode="contained-tonal" style={[styles.btn,{marginLeft:6}]}
                onPress={()=>sendAll("sms")} loading={busy}>
                Text all
              </Button>
            </View>
            <Button icon="alert-decagram-outline" mode="elevated" onPress={()=>sendAll("both")}
              style={{ marginTop:10, borderRadius:14 }} loading={busy}>
              SOS (Email + SMS)
            </Button>
            <Text style={[styles.mutedSmall,{marginTop:8}]}>
              Uses your device’s SMS/Email apps (expo-sms / mail-composer).
            </Text>
          </Card.Content>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b1220" },
  scroll: { flex: 1 },
  title: { color: "#e2e8f0", marginBottom: 6, fontSize: 22, fontWeight: "800" },
  muted: { color: "#94a3b8", marginBottom: 12, lineHeight: 20 },
  mutedSmall: { color: "#94a3b8", fontSize: 12 },
  card: {
    backgroundColor: "#111827",
    borderColor: "rgba(99,102,241,0.25)",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 14,
  },
  cardTitle: { color: "#e5e7eb", fontWeight: "700" },
  input: { marginBottom: 10, backgroundColor: "#0b1220" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  btn: { flex: 1, borderRadius: 14 },
});

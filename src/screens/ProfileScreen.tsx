import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { Button, Text, TextInput, SegmentedButtons, Snackbar, Portal } from "react-native-paper";
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
// import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../api/client";

type Profile = {
  firstName?: string;
  lastName?: string;
  dobISO?: string;
  country?: string;
  gender?: "male" | "female" | "na";
  phone?: string;
  email?: string;
};

const COUNTRIES = ["Kenya","United States","United Kingdom","Canada","India","Nigeria","South Africa","Germany","France","Other"];

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile>({
    firstName:"", lastName:"", dobISO:"", country:"", gender:"na", phone:"", email:user?.email || "",
  });
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [snack, setSnack] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.get();
        if (data?.ok && data.profile) setProfile((p)=>({ ...p, ...data.profile }));
      } catch {}
    })();
  }, []);

  const dobLabel = profile.dobISO ? new Date(profile.dobISO).toDateString() : "Select";

  const onPickDOB = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "ios") setShowIosPicker(false);
    if (date) setProfile((p) => ({ ...p, dobISO: date.toISOString().slice(0, 10) }));
  };

  const openDOB = () => {
    const value = profile.dobISO ? new Date(profile.dobISO) : new Date(1990, 0, 1);
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode: "date",
        onChange: onPickDOB,
        maximumDate: new Date(),
      });
    } else {
      setShowIosPicker(true);
    }
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await profileApi.update({
        firstName: profile.firstName?.trim(),
        lastName:  profile.lastName?.trim(),
        dobISO:    profile.dobISO,
        country:   profile.country,
        gender:    profile.gender || "na",
        phone:     profile.phone,
      });
      setSnack(true);
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wrap}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your personal details</Text>

            <TextInput
              mode="outlined"
              label="Email"
              value={profile.email || user?.email || ""}
              editable={false}
              style={styles.input}
              textColor="#e2e8f0"
              placeholder="email@example.com"
              placeholderTextColor="#94a3b8"
              theme={inputTheme}
            />

            <TextInput
              mode="outlined"
              label="Phone (+254…)"
              value={profile.phone || ""}
              onChangeText={(t)=>setProfile((p)=>({...p,phone:t}))}
              style={styles.input}
              textColor="#e2e8f0"
              placeholder="+2547…"
              placeholderTextColor="#94a3b8"
              theme={inputTheme}
              keyboardType="phone-pad"
            />

            <View style={{ height: 10 }} />
            <Text style={styles.section}>Personal</Text>

            <TextInput
              mode="outlined"
              label="First name"
              value={profile.firstName || ""}
              onChangeText={(t)=>setProfile((p)=>({...p,firstName:t}))}
              style={styles.input}
              textColor="#e2e8f0"
              placeholder="Jane"
              placeholderTextColor="#94a3b8"
              theme={inputTheme}
            />

            <TextInput
              mode="outlined"
              label="Last name"
              value={profile.lastName || ""}
              onChangeText={(t)=>setProfile((p)=>({...p,lastName:t}))}
              style={styles.input}
              textColor="#e2e8f0"
              placeholder="Doe"
              placeholderTextColor="#94a3b8"
              theme={inputTheme}
            />

            <Button mode="outlined" onPress={openDOB} style={styles.input} textColor="#e2e8f0">
              Date of Birth: {dobLabel}
            </Button>

            {showIosPicker && Platform.OS === "ios" && (
              <DateTimePicker
                value={profile.dobISO ? new Date(profile.dobISO) : new Date(1990,0,1)}
                mode="date"
                display="inline"
                themeVariant="dark"
                textColor="#e2e8f0"
                onChange={onPickDOB}
                maximumDate={new Date()}
              />
            )}

            {/* Country picker left commented out, but styles kept for later use.
            <Text style={styles.fieldLabel}>Country</Text>
            <View style={styles.pickerWrap}>
              <Picker
                mode="dropdown"
                selectedValue={profile.country || ""}
                onValueChange={(v)=>setProfile((p)=>({...p,country:String(v)}))}
                dropdownIconColor="#cbd5e1"
                style={styles.picker}
              >
                <Picker.Item label="Select your country" value="" />
                {COUNTRIES.map((c)=> <Picker.Item key={c} label={c} value={c} />)}
              </Picker>
            </View> */}

            <Text style={[styles.fieldLabel,{marginTop:12}]}>Gender</Text>
            <SegmentedButtons
              value={profile.gender || "na"}
              onValueChange={(v)=>setProfile((p)=>({...p,gender: v as any}))}
              buttons={[{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"na",label:"Rather not say"}]}
              density="small"
              style={styles.segmented}
            />

            <Button mode="contained" onPress={onSave} style={{ marginTop: 16 }} loading={busy}>
              Save
            </Button>
            <Button mode="text" onPress={()=>navigation.goBack()} style={{ marginTop: 4, marginBottom: 20 }}>
              Back
            </Button>
          </View>
        </ScrollView>

        <Portal>
          <Snackbar
            visible={snack}
            onDismiss={()=>setSnack(false)}
            duration={1800}
            style={[styles.topSnack, { top: insets.top + 16 }]}
          >
            <Text style={{ color:"#e2e8f0", fontWeight:"700" }}>✓ Saved</Text>
          </Snackbar>
        </Portal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputTheme = {
  colors: {
    primary:"#93c5fd",
    onSurface:"#e2e8f0",
    surface:"#04070e",
    outline:"rgba(148,163,184,0.35)",
    placeholder:"#94a3b8"
  },
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b1220" },
  scrollContent: { paddingBottom: 40 },
  wrap: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { color: "#e2e8f0", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#94a3b8", marginTop: 2, marginBottom: 10 },
  section: { color: "#cbd5e1", fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: "#04070e", marginBottom: 12, borderRadius: 12 },
  fieldLabel: { color: "#cbd5e1", marginBottom: 6 },
  pickerWrap: {
    borderWidth: 1, borderColor: "rgba(148,163,184,0.35)", borderRadius: 12, overflow: "hidden",
    backgroundColor: "rgba(2,6,23,0.5)", marginBottom: 12,
  },
  picker: { color: "#e2e8f0", height: 48 },
  segmented: { backgroundColor: "transparent", alignSelf: "stretch" },
  topSnack: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});

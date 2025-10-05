import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Text, Snackbar, Button, Portal, Dialog } from "react-native-paper";
import TileCard from "../components/TileCard";
import { useAuth } from "../context/AuthContext";
import * as Location from "expo-location";

type Tile = { key: string; title: string; icon: string; nav?: string; disabled?: boolean };

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const tiles: Tile[] = [
    { key: "assistive", title: "Assistive", icon: "robot", nav: "Assistant" },
    { key: "profile",   title: "Profile",   icon: "account-circle", nav: "Profile" },
    { key: "safety",    title: "Safety",    icon: "alert-decagram", nav: "Safety" },
    { key: "security",  title: "Security",  icon: "shield-lock",    disabled: true },
    { key: "camera",    title: "Camera",    icon: "camera",         disabled: true },
    { key: "access",    title: "Accessibility", icon: "human-wheelchair", disabled: true },
    { key: "notify",    title: "Notifications", icon: "bell",        disabled: true },
    { key: "privacy",   title: "Privacy",   icon: "incognito",       disabled: true },
    { key: "billing",   title: "Billing",   icon: "credit-card-outline", disabled: true },
    { key: "meta",      title: "Meta",      icon: "application-brackets-outline", disabled: true },
  ];

  const onTilePress = (t: Tile) => {
    if (t.disabled || !t.nav) setSnack({ visible: true, text: "Coming soon" });
    else navigation.navigate(t.nav);
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout(); // clears token/user + axios header
      // No manual navigation needed — AppNavigator will switch to Auth stack automatically
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Hello {user?.email || "there"} 👋
        </Text>
        <Text style={styles.headerSub}>Welcome back</Text>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        data={tiles}
        numColumns={2}
        keyExtractor={(it) => it.key}
        renderItem={({ item }) => (
          <TileCard
            title={item.title}
            icon={item.icon}
            onPress={() => onTilePress(item)}
            disabled={!!item.disabled}
          />
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: 8, marginTop: 6 }}>
            <Button
              icon="logout"
              mode="outlined"
              textColor="#ef4444"
              style={styles.logoutCard}
              onPress={() => setConfirmOpen(true)}
            >
              Log out
            </Button>
          </View>
        }
      />

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2000}
        style={{ backgroundColor: "#1f2937" }}
      >
        {snack.text}
      </Snackbar>

      <Portal>
        <Dialog visible={confirmOpen} onDismiss={() => setConfirmOpen(false)} style={{ backgroundColor: "#0b1220" }}>
          <Dialog.Title style={{ color: "#e2e8f0" }}>Log out</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: "#94a3b8" }}>Are you sure you want to log out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmOpen(false)}>Cancel</Button>
            <Button mode="contained" onPress={doLogout} loading={loggingOut}>
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 18, paddingBottom: 10, paddingHorizontal: 16, backgroundColor: "#0b1220" },
  headerTitle: { color: "#e2e8f0", marginBottom: 2 },
  headerSub: { color: "#94a3b8" },
  logoutCard: {
    width: "100%",
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 16,
    paddingVertical: 8,
  },
});

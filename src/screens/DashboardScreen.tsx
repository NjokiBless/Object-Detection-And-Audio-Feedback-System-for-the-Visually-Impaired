// vi-app/src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Snackbar, Button, Portal, Dialog } from "react-native-paper";
import TileCard from "../components/TileCard";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext"; // Import to show active status
import * as Location from "expo-location";

type Tile = { key: string; title: string; icon: string; nav: string };

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { isNavigating, lastInstruction } = useNavigation(); // Get nav state
  
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const tiles: Tile[] = [
    // Added Navigation Tile
    { key: "map", title: "Navigation", icon: "map-marker-radius", nav: "Map" },
    { key: "detector", title: "Detector", icon: "camera", nav: "DetectorLauncher" },
    { key: "access", title: "Accessibility", icon: "human-wheelchair", nav: "Accessibility" },
    { key: "insights", title: "Insights", icon: "chart-line", nav: "Insights" },
    { key: "help", title: "Help", icon: "help-circle", nav: "Help" },
    { key: "security", title: "Security", icon: "shield-lock", nav: "Security" },
    { key: "profile", title: "Profile", icon: "account-circle", nav: "Profile" },
    { key: "safety", title: "Safety", icon: "alert-decagram", nav: "Safety" },
    { key: "about", title: "About", icon: "information-outline", nav: "About" },
  ];

  const onTilePress = (t: Tile) => {
    if (!t.nav) {
      setSnack({ visible: true, text: "Coming soon" });
    } else {
      navigation.navigate(t.nav);
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
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

      {/* Optional: Show active navigation banner if user is on dashboard but nav is running */}
      {isNavigating && (
        <Button 
            mode="contained" 
            icon="navigation" 
            style={{marginHorizontal: 16, marginVertical: 8, backgroundColor: '#059669'}}
            onPress={() => navigation.navigate('Map')}
        >
            Navigating: {lastInstruction.substring(0, 30)}...
        </Button>
      )}

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
            disabled={false}
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

      {/* Snackbars and Dialogs same as before... */}
      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2000}
        style={{ backgroundColor: "#1f2937" }}
      >
        {snack.text}
      </Snackbar>

      <Portal>
        <Dialog
          visible={confirmOpen}
          onDismiss={() => setConfirmOpen(false)}
          style={{ backgroundColor: "#0b1220" }}
        >
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
  header: {
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "#0b1220",
  },
  headerTitle: { color: "#e2e8f0", marginBottom: 2 },
  headerSub: { color: "#94a3b8" },
  logoutCard: {
    width: "100%",
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 16,
    paddingVertical: 8,
  },
});
// src/screens/DetectorLauncher.tsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Linking, Alert } from "react-native";

const DETECTOR_URL = "https://192.168.0.10:8443";

export default function DetectorLauncher() {
  useEffect(() => {
    (async () => {
      try {
        const supported = await Linking.canOpenURL(DETECTOR_URL);
        if (supported) {
          await Linking.openURL(DETECTOR_URL);
        } else {
          Alert.alert(
            "Cannot open URL",
            "Your device could not open the detector URL: " + DETECTOR_URL
          );
        }
      } catch (err) {
        console.log("openURL error", err);
        Alert.alert("Error", "Could not open the detector page.");
      }
    })();
  }, []);

  return (
    <View style={styles.center}>
      <ActivityIndicator color="#fff" />
      <Text style={styles.text}>Opening detector…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#e2e8f0",
    marginTop: 10,
  },
});

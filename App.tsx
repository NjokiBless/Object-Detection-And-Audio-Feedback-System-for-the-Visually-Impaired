import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./src/navigation/AppNavigator"; // <-- should export navigators (no NavigationContainer inside)
import { AuthProvider } from "./src/context/AuthContext";
import BioOptInGate from "./src/components/BioOptInGate";

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            {/* Global UI overlays that should live above screens but inside navigation/providers */}
            <BioOptInGate />

            {/* Your app’s screens */}
            <AppNavigator />

            {/* Status bar styling */}
            <StatusBar style="light" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

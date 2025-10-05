import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

const Tab = createMaterialTopTabNavigator();

export default function AuthTabs() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", paddingTop: insets.top }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#0b1220" },
          tabBarIndicatorStyle: { backgroundColor: "#fff" },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#94a3b8",
        }}
      >
        <Tab.Screen name="Login" component={LoginScreen} />
        <Tab.Screen name="Register" component={RegisterScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

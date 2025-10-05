// vi-mobile/vi-app/src/navigation/AppNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import AuthTabs from "./AuthTabs"; // Login/Register tabs
import OTPVerifyScreen from "../screens/OTPVerifyScreen";

import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SafetyScreen from "../screens/SafetyScreen";
import AssistantScreen from "../screens/AssistantScreen";

/** Nested auth stack routes (tabs + OTP screen) */
export type AuthStackParamList = {
  AuthTabs: undefined;                    // Login / Register tabs
  OTPVerify: { email: string } | undefined;
};

/** App (protected) stack routes */
export type AppStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Safety: undefined;
  Assistant: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="AuthTabs" component={AuthTabs} />
      <AuthStack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    </AuthStack.Navigator>
  );
}

function ProtectedAppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Dashboard" component={DashboardScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="Safety" component={SafetyScreen} />
      <AppStack.Screen name="Assistant" component={AssistantScreen} />
    </AppStack.Navigator>
  );
}

/**
 * Root: chooses Auth vs App based on token.
 * No NavigationContainer here because your App.tsx provides it.
 */
export default function AppNavigator() {
  const { token } = useAuth();

  // If there’s no token -> show auth flow (Login/Register/OTP)
  // If token exists -> show app flow (Dashboard etc.)
  return token ? <ProtectedAppNavigator /> : <AuthNavigator />;
}

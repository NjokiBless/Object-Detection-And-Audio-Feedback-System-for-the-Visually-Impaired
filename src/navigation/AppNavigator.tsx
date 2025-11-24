// vi-app/src/navigation/AppNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { NavigationProvider } from "../context/NavigationContext"; // <--- Import Provider

import AuthTabs from "./AuthTabs";
import OTPVerifyScreen from "../screens/OTPVerifyScreen";

import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SafetyScreen from "../screens/SafetyScreen";
import AssistantScreen from "../screens/AssistantScreen";
import DetectorLauncher from "../screens/DetectorLauncher";
import MapScreen from "../screens/MapScreen"; // <--- Import Map Screen

import AccessibilityScreen from "../screens/AccessibilityScreen";
import HelpScreen from "../screens/HelpScreen";
import InsightsScreen from "../screens/InsightsScreen";
import SecurityScreen from "../screens/SecurityScreen";
import AboutScreen from "../screens/AboutScreen";
import FitnessScreen from "../screens/FitnessScreen";

export type AuthStackParamList = {
  AuthTabs: undefined;
  OTPVerify: { email: string } | undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Safety: undefined;
  Assistant: undefined;
  DetectorLauncher: undefined;
  Map: undefined; // <--- Add Type
  Accessibility: undefined;
  Help: undefined;
  Insights: undefined;
  Security: undefined;
  About: undefined;
  Fitness: undefined;
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
    // Wrap protected screens with NavigationProvider so voice persists
    <NavigationProvider>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Dashboard" component={DashboardScreen} />
        <AppStack.Screen name="Map" component={MapScreen} /> 
        <AppStack.Screen name="DetectorLauncher" component={DetectorLauncher} />
        <AppStack.Screen name="Assistant" component={AssistantScreen} />
        <AppStack.Screen name="Fitness" component={FitnessScreen} />
        <AppStack.Screen name="Accessibility" component={AccessibilityScreen} />
        <AppStack.Screen name="Insights" component={InsightsScreen} />
        <AppStack.Screen name="Help" component={HelpScreen} />
        <AppStack.Screen name="Security" component={SecurityScreen} />
        <AppStack.Screen name="Profile" component={ProfileScreen} />
        <AppStack.Screen name="Safety" component={SafetyScreen} />
        <AppStack.Screen name="About" component={AboutScreen} />
      </AppStack.Navigator>
    </NavigationProvider>
  );
}

export default function AppNavigator() {
  const { token } = useAuth();
  return token ? <ProtectedAppNavigator /> : <AuthNavigator />;
}
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  title: string;
  icon: string;               // MaterialCommunityIcons name, e.g. "account"
  onPress?: () => void;
  disabled?: boolean;
};

export default function TileCard({ title, icon, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, disabled && { opacity: 0.55 }]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={28} color="#c7d2fe" />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    margin: 8,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#131a2a",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)", // indigo-400 @ 25%
    justifyContent: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 14,
  },
});

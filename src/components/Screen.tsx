import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

export const Screen: React.FC<React.PropsWithChildren> = ({children})=>{
  return <View style={styles.root}>{children}</View>;
};

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: theme.colors.bg, paddingHorizontal:16, paddingTop:48 }
});

// vi-app/src/screens/AboutScreen.tsx
import React from "react";
import { Linking, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Text } from "react-native-paper";

export default function AboutScreen() {
  const openGitHub = () => {
    const url = "https://github.com/your-username/vi-app"; // update to your real repo
    Linking.openURL(url).catch((e) => console.log("GitHub open error", e));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          About this app
        </Text>
        <Text style={styles.subtitle}>
          A vision-assistive companion designed to make everyday navigation more
          confident for people with low or no vision.
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Version</Text>
            <Text style={styles.body}>1.0.0</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Project</Text>
            <Text style={styles.body}>
              This is a student / research project that uses on-device
              object detection and smart assistance to describe the
              environment in real time.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Source code</Text>
            <Text style={styles.body}>
              You can view the code, report issues or contribute on GitHub.
            </Text>
            <Button mode="contained-tonal" style={{ marginTop: 8 }} onPress={openGitHub}>
              Open GitHub
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    color: "#e5e7eb",
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  sectionTitle: {
    color: "#e5e7eb",
    marginBottom: 4,
    fontWeight: "600",
  },
  body: {
    color: "#9ca3af",
  },
});

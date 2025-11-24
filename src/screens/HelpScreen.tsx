// vi-app/src/screens/HelpScreen.tsx
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Linking } from "react-native";
import { Text, List, Button, Divider } from "react-native-paper";

export default function HelpScreen() {
  const openEmail = () => {
    // Replace with your real support email
    const email = "support@example.com";
    const subject = encodeURIComponent("Help with VI app");
    const body = encodeURIComponent("Hi,\n\nI need help with...");
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch((e) => console.log("Email open error", e));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Help & Tutorials
        </Text>
        <Text style={styles.subtitle}>
          Learn how to get the best experience and find quick answers to common questions.
        </Text>

        <Divider style={styles.divider} />

        {/* Quick start tips */}
        <Text style={styles.sectionTitle}>Quick start</Text>
        <List.Section>
          <List.Item
            title="1. Log in and open the Detector"
            description="From the dashboard, tap Detector to start using the camera view."
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDesc}
          />
          <List.Item
            title="2. Hold your phone steadily"
            description="Keep the back camera pointing roughly in the direction you’re moving. Avoid covering the lens."
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDesc}
          />
          <List.Item
            title="3. Listen for feedback"
            description="The app uses sound and vibration to give you signals. You can adjust them in Accessibility or Safety."
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDesc}
          />
        </List.Section>

        <Divider style={styles.divider} />

        {/* FAQ */}
        <Text style={styles.sectionTitle}>FAQ</Text>
        <List.Section>
          <List.Accordion
            title="I don't hear any sound."
            titleStyle={styles.listTitle}
            style={styles.accordion}
          >
            <Text style={styles.faqText}>
              Make sure your phone volume is up and not in silent mode. If you use headphones,
              confirm they’re connected. You can also check the Accessibility screen to adjust
              audio settings.
            </Text>
          </List.Accordion>

          <List.Accordion
            title="The app feels slow."
            titleStyle={styles.listTitle}
            style={styles.accordion}
          >
            <Text style={styles.faqText}>
              Try closing other apps, and ensure you have good lighting. On older phones, reducing
              background apps can make a big difference.
            </Text>
          </List.Accordion>

          <List.Accordion
            title="How do I reset my password?"
            titleStyle={styles.listTitle}
            style={styles.accordion}
          >
            <Text style={styles.faqText}>
              Open the Security screen from the dashboard to change your password. If you forgot
              it completely, use the login email flow again.
            </Text>
          </List.Accordion>
        </List.Section>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Still stuck?</Text>
        <Text style={styles.subtitle}>
          You can reach out and describe what’s happening. Sharing screenshots or a short screen
          recording really helps.
        </Text>

        <Button mode="contained" onPress={openEmail} style={styles.button}>
          Contact support
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  title: { color: "#e2e8f0", marginBottom: 4 },
  subtitle: { color: "#94a3b8", marginBottom: 16 },
  divider: { backgroundColor: "#1f2937", marginVertical: 12 },
  sectionTitle: { color: "#e2e8f0", marginBottom: 8, fontWeight: "600" },
  listTitle: { color: "#e5e7eb" },
  listDesc: { color: "#9ca3af" },
  accordion: { backgroundColor: "#020617" },
  faqText: { color: "#cbd5f5", paddingHorizontal: 16, paddingBottom: 12 },
  button: { marginTop: 12, borderRadius: 10 },
});

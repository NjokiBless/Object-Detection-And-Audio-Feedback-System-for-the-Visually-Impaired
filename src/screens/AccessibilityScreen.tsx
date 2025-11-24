// vi-app/src/screens/AccessibilityScreen.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View, StyleSheet } from "react-native";
import { Text, RadioButton, Switch, Divider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TextScale = "small" | "medium" | "large";
type Handedness = "right" | "left";

type AccessibilityPrefs = {
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
  handedness: Handedness;
};

const STORAGE_KEY = "vi_prefs_accessibility_v1";

export default function AccessibilityScreen() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>({
    textScale: "medium",
    highContrast: false,
    reduceMotion: false,
    handedness: "right",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setPrefs((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.log("Accessibility load error", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const update = (patch: Partial<AccessibilityPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
        console.log("Accessibility save error", e)
      );
      return next;
    });
  };

  const labelSize = prefs.textScale === "small" ? 14 : prefs.textScale === "large" ? 18 : 16;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Accessibility
        </Text>
        <Text style={styles.subtitle}>
          Tune how the app looks and feels so it’s comfortable for you to use.
        </Text>

        <Divider style={styles.divider} />

        {/* Text size */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: labelSize }]}>Text & UI size</Text>
          <RadioButton.Group
            onValueChange={(value) => update({ textScale: value as TextScale })}
            value={prefs.textScale}
          >
            <View style={styles.row}>
              <RadioButton value="small" />
              <Text style={[styles.optionLabel, { fontSize: labelSize }]}>Small</Text>
            </View>
            <View style={styles.row}>
              <RadioButton value="medium" />
              <Text style={[styles.optionLabel, { fontSize: labelSize }]}>Medium</Text>
            </View>
            <View style={styles.row}>
              <RadioButton value="large" />
              <Text style={[styles.optionLabel, { fontSize: labelSize }]}>Large</Text>
            </View>
          </RadioButton.Group>
        </View>

        {/* High contrast */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.sectionTitle, { fontSize: labelSize }]}>High contrast</Text>
              <Text style={styles.sectionHint}>
                Stronger colors and clearer borders for low-vision use.
              </Text>
            </View>
            <Switch
              value={prefs.highContrast}
              onValueChange={(v) => update({ highContrast: v })}
            />
          </View>
        </View>

        {/* Reduce motion */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.sectionTitle, { fontSize: labelSize }]}>Reduce motion</Text>
              <Text style={styles.sectionHint}>
                Turn off heavy animations if they feel distracting or uncomfortable.
              </Text>
            </View>
            <Switch
              value={prefs.reduceMotion}
              onValueChange={(v) => update({ reduceMotion: v })}
            />
          </View>
        </View>

        {/* Handedness */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: labelSize }]}>One-hand layout</Text>
          <RadioButton.Group
            onValueChange={(value) => update({ handedness: value as Handedness })}
            value={prefs.handedness}
          >
            <View style={styles.row}>
              <RadioButton value="right" />
              <Text style={[styles.optionLabel, { fontSize: labelSize }]}>Right-handed</Text>
            </View>
            <View style={styles.row}>
              <RadioButton value="left" />
              <Text style={[styles.optionLabel, { fontSize: labelSize }]}>Left-handed</Text>
            </View>
          </RadioButton.Group>
          <Text style={styles.sectionHint}>
            This can be used later to move key buttons closer to your thumb.
          </Text>
        </View>

        {!loaded && <Text style={styles.loading}>Loading your preferences…</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  title: { color: "#e2e8f0", marginBottom: 4 },
  subtitle: { color: "#94a3b8", marginBottom: 16 },
  divider: { backgroundColor: "#1f2937", marginBottom: 16 },

  section: { marginBottom: 20 },
  sectionTitle: { color: "#e2e8f0", marginBottom: 8 },
  sectionHint: { color: "#64748b", marginTop: 4, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionLabel: { color: "#cbd5f5" },
  loading: { color: "#64748b", marginTop: 12 },
});

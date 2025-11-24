// vi-app/src/screens/FitnessScreen.tsx
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from "react-native-health";

const isIOS = Platform.OS === "ios";

type DailySummary = {
  date: string;
  steps: number;
};

export default function FitnessScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daily, setDaily] = useState<DailySummary[]>([]);

  useEffect(() => {
    if (!isIOS) {
      setError("Fitness data from Google Fit will appear here in a later version.");
      setLoading(false);
      return;
    }
    initAppleHealth();
  }, []);

  const initAppleHealth = () => {
    // Guard against the native module being missing / broken
    if (
      !AppleHealthKit ||
      typeof (AppleHealthKit as any).initHealthKit !== "function"
    ) {
      console.log("AppleHealthKit.initHealthKit is not available");
      setError("Apple HealthKit is not available on this build.");
      setLoading(false);
      return;
    }

    const PERMS: any = (AppleHealthKit as any).Constants?.Permissions || {};
    const options: HealthKitPermissions = {
      permissions: {
        read: [PERMS.StepCount],
        write: [],
      },
    };

    (AppleHealthKit as any).initHealthKit(options, (err: string) => {
      if (err) {
        console.log("HealthKit init error:", err);
        setError("Health permissions denied or unavailable.");
        setLoading(false);
        return;
      }
      fetchAppleSteps();
    });
  };

  const fetchAppleSteps = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6); // last 7 days

    const opts = {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };

    const fn = (AppleHealthKit as any).getDailyStepCountSamples;
    if (typeof fn !== "function") {
      console.log("getDailyStepCountSamples not available");
      setError("Cannot read steps from Apple Health on this device.");
      setLoading(false);
      return;
    }

    fn(opts, (err: string, results: HealthValue[]) => {
      if (err) {
        console.log("HealthKit steps error:", err);
        setError("Failed to load steps from Apple Health.");
        setLoading(false);
        return;
      }

      const mapped: DailySummary[] = (results || []).map((r: any) => ({
        date: r.startDate?.slice(0, 10) ?? "",
        steps: Number(r.value || 0),
      }));

      setDaily(mapped.reverse());
      setLoading(false);
    });
  };

  const today = daily[daily.length - 1]?.steps ?? 0;
  const weekTotal = daily.reduce((sum, d) => sum + d.steps, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Fitness
        </Text>
        <Text style={styles.subtitle}>
          See your recent step activity from your phone’s health data.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.meta}>Loading health data…</Text>
          </View>
        )}

        {!loading && error && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.errorTitle}>Health data unavailable</Text>
              <Text style={styles.body}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Today</Text>
                <Text style={styles.bigNumber}>{today.toLocaleString()}</Text>
                <Text style={styles.meta}>steps</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Last 7 days</Text>
                <Text style={styles.bigNumber}>{weekTotal.toLocaleString()}</Text>
                <Text style={styles.meta}>total steps</Text>

                {daily.map((d) => (
                  <View key={d.date} style={styles.row}>
                    <Text style={styles.rowLabel}>{d.date}</Text>
                    <Text style={styles.rowValue}>{d.steps.toLocaleString()}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </>
        )}
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
  bigNumber: {
    color: "#22c55e",
    fontSize: 32,
    fontWeight: "700",
  },
  meta: {
    color: "#9ca3af",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rowLabel: { color: "#9ca3af" },
  rowValue: { color: "#e5e7eb", fontWeight: "500" },
  center: { alignItems: "center", marginTop: 24 },
  errorTitle: {
    color: "#fecaca",
    fontWeight: "600",
    marginBottom: 4,
  },
  body: { color: "#e5e7eb" },
});

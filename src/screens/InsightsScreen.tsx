// vi-app/src/screens/InsightsScreen.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Text, Card, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UsageStats = {
  totalSeconds: number;
  sessionCount: number;
  lastResetAt?: string;
};

const STORAGE_KEY = "vi_usage_stats_v1";

export default function InsightsScreen() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setStats(JSON.parse(raw));
      } else {
        setStats({ totalSeconds: 0, sessionCount: 0, lastResetAt: new Date().toISOString() });
      }
    } catch (e) {
      console.log("Insights load error", e);
      setStats({ totalSeconds: 0, sessionCount: 0, lastResetAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const resetStats = async () => {
    setResetting(true);
    try {
      const fresh: UsageStats = { totalSeconds: 0, sessionCount: 0, lastResetAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setStats(fresh);
    } catch (e) {
      console.log("Insights reset error", e);
    } finally {
      setResetting(false);
    }
  };

  const totalMinutes = stats ? stats.totalSeconds / 60 : 0;
  const avgMinutes = stats && stats.sessionCount > 0 ? totalMinutes / stats.sessionCount : 0;
  const lastReset = stats?.lastResetAt ? new Date(stats.lastResetAt).toLocaleString() : "—";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Insights
        </Text>
        <Text style={styles.subtitle}>
          Simple stats about how you’ve been using the app. This is stored on your device only.
        </Text>

        {loading && (
          <View style={{ marginTop: 32 }}>
            <ActivityIndicator />
          </View>
        )}

        {!loading && stats && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardLabel}>Total usage time</Text>
                <Text style={styles.cardValue}>{totalMinutes.toFixed(1)} minutes</Text>
                <Text style={styles.cardHint}>
                  This is an estimate of how long the app has been active.
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardLabel}>Number of sessions</Text>
                <Text style={styles.cardValue}>{stats.sessionCount}</Text>
                <Text style={styles.cardHint}>
                  Each time you start a new session, it can be counted here.
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardLabel}>Average session length</Text>
                <Text style={styles.cardValue}>{avgMinutes.toFixed(1)} minutes</Text>
                <Text style={styles.cardHint}>
                  Useful for understanding how you prefer to use the app.
                </Text>
              </Card.Content>
            </Card>

            <Text style={styles.meta}>Last reset: {lastReset}</Text>

            <Button
              mode="outlined"
              onPress={resetStats}
              loading={resetting}
              style={styles.resetButton}
            >
              Reset stats
            </Button>

            <Text style={styles.smallHint}>
              To keep these numbers accurate, you can update them whenever a Detector session
              starts or ends.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  title: { color: "#e2e8f0", marginBottom: 4 },
  subtitle: { color: "#94a3b8", marginBottom: 16 },
  card: { backgroundColor: "#020617", marginBottom: 12, borderRadius: 14 },
  cardLabel: { color: "#9ca3af", marginBottom: 4 },
  cardValue: { color: "#e5e7eb", fontSize: 22, fontWeight: "600", marginBottom: 4 },
  cardHint: { color: "#6b7280", fontSize: 13 },
  meta: { color: "#6b7280", marginTop: 8 },
  resetButton: { marginTop: 12, borderRadius: 10 },
  smallHint: { color: "#64748b", fontSize: 12, marginTop: 8 },
});

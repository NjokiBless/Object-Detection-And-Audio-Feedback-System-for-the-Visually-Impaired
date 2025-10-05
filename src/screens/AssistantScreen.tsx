import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Button, Text } from "react-native-paper";
import { Camera, CameraView } from "expo-camera";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import axios from "axios";

import DetectionOverlay from "../components/DetectionOverlay";
import { DETECT_BASE } from "../api/client";

type Item = {
  name: string;
  score: number;
  bbox: [number, number, number, number];
  pos: string;
  prox: string;
};

export default function AssistantScreen({ navigation }: any) {
  // --- camera view size (4:3) ---
  const camRef = useRef<CameraView>(null);
  const viewW = Dimensions.get("window").width;
  const viewH = Math.round((viewW * 4) / 3);

  // --- permissions ---
  type Perm = { granted: boolean } | null;
  const [perm, setPerm] = useState<Perm>(null);
  const requestPerm = async () => {
    const r = await Camera.requestCameraPermissionsAsync();
    setPerm(r as any);
  };

  useEffect(() => {
    (async () => {
      const p = await Camera.getCameraPermissionsAsync();
      if (!p.granted) {
        const r = await Camera.requestCameraPermissionsAsync();
        setPerm(r as any);
      } else {
        setPerm(p as any);
      }

      // Make sure speech plays even in silent mode on iOS
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch {}
    })();
  }, []);

  // --- runtime state ---
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  const [muted, setMuted] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });

  // --- detection loop ---
  useEffect(() => {
    let stopped = false;

    async function loop() {
      if (stopped) return;

      try {
        if (running && ready && camRef.current) {
          const photo = await camRef.current.takePictureAsync({
            quality: 0.4,
            skipProcessing: true,
            base64: true,
          });

          if (photo?.base64) {
            const image = `data:image/jpeg;base64,${photo.base64}`;
            const url = `${DETECT_BASE}/detect`;

            const { data } = await axios.post(url, { image }, { timeout: 15000 });

            const fw: number = data?.width ?? photo.width ?? 0;
            const fh: number = data?.height ?? photo.height ?? 0;
            const dets: any[] = Array.isArray(data?.detections) ? data.detections : [];

            setFrameSize({ w: fw, h: fh });

            const parsed: Item[] = dets.map((d) => {
              const [x1, y1, x2, y2] = d.bbox as [number, number, number, number];
              const cx = (x1 + x2) / 2;
              const pos = bucketPos(cx, fw);
              const prox = bucketProx(x1, y1, x2, y2, fw, fh);
              return { name: d.name, score: d.score, bbox: [x1, y1, x2, y2], pos, prox };
            });

            setItems(parsed);

            // --- quick debug line in Metro (and can be seen in terminal) ---
            console.log(`[assistant] ${parsed.length} detections`, parsed.map(p => p.name).slice(0,3));

            if (!muted && parsed.length > 0) {
              speakGuidance(parsed);
            }
          }
        }
      } catch (err) {
        console.log("[assistant] error", err?.toString?.() || err);
      } finally {
        setTimeout(loop, 500); // ~2 fps; safe for CPU + avoids saturating network
      }
    }

    setTimeout(loop, 500);
    return () => {
      stopped = true;
    };
  }, [running, ready, muted]);

  // --- permission UI ---
  if (perm === null) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }
  if (!perm.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission is required.</Text>
        <Button mode="contained" onPress={requestPerm} style={{ marginTop: 12 }}>
          Grant
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CameraView
        ref={camRef}
        style={{ width: viewW, height: viewH }}
        facing="back"
        onCameraReady={() => setReady(true)}
      />

      <DetectionOverlay
        items={items}
        frameW={frameSize.w}
        frameH={frameSize.h}
        viewW={viewW}
        viewH={viewH}
      />

      {/* Tiny debug banner so you know if the model sees anything */}
      <View style={styles.debugBar}>
        <Text style={{ color: "#cbd5e1" }}>
          {items.length ? `${items.length} object(s): ${items.map(i=>i.name).slice(0,3).join(", ")}` : "No detections"}
        </Text>
      </View>

      <View style={styles.row}>
        <Button
          mode={running ? "contained-tonal" : "contained"}
          onPress={() => setRunning((r) => !r)}
          style={styles.btn}
        >
          {running ? "Pause" : "Start"}
        </Button>

        <Button
          mode={muted ? "contained-tonal" : "contained"}
          onPress={() => setMuted((m) => !m)}
          style={styles.btn}
        >
          {muted ? "Unmute" : "Mute"}
        </Button>

        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.btn}>
          Back
        </Button>
      </View>
    </View>
  );
}

/* -------- helpers -------- */

function bucketPos(cx: number, W: number): "left" | "center" | "right" {
  const r = cx / (W + 1e-6);
  if (r < 0.33) return "left";
  if (r < 0.66) return "center";
  return "right";
}

function bucketProx(x1: number, y1: number, x2: number, y2: number, W: number, H: number) {
  const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const ratio = area / (W * H + 1e-6);
  if (ratio >= 0.20) return "very close";
  if (ratio >= 0.07) return "close";
  return "ahead";
}

function speakGuidance(arr: Item[]) {
  const sorted = [...arr].sort((a, b) => b.score - a.score).slice(0, 3);
  const now = Date.now() / 1000;

  // cooldown cache
  // @ts-ignore
  if (!speakGuidance._last) speakGuidance._last = {};
  // @ts-ignore
  const last: Record<string, number> = speakGuidance._last;

  const cooldown = 3.5;
  let spoke = 0;

  for (const it of sorted) {
    if (spoke >= 3) break;
    const key = `${it.name}-${it.pos}-${it.prox}`;
    const prev = last[key] ?? 0;
    if (now - prev < cooldown) continue;

    const phrase = `${it.name} ${it.pos}, ${it.prox}`;
    Speech.speak(phrase, { rate: 1.0, language: "en-US" });
    last[key] = now;
    spoke++;
  }
}

/* -------- styles -------- */

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
  },
  row: {
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  debugBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(2,6,23,0.7)",
    zIndex: 20,
  },
});

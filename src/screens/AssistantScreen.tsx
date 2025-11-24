import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

// TF
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Det = {
  name: string;
  score: number;
  bbox: [number, number, number, number]; // [x,y,w,h]
};

export default function AssistantScreen() {
  const camRef = useRef<CameraView>(null);

  const [camPerm, setCamPerm] = useState<{ granted: boolean } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [tfReady, setTfReady] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>("Loading model…");

  const [detections, setDetections] = useState<Det[]>([]);
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });

  // remember speech per label
  const speakStateRef = useRef<Record<string, { lastTime: number; lastHeight: number }>>({});

  // 1) camera + audio
  useEffect(() => {
    (async () => {
      const p = await Camera.requestCameraPermissionsAsync();
      setCamPerm(p);

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
      } catch {}
    })();
  }, []);

  // 2) TF init
  useEffect(() => {
    (async () => {
      try {
        await tf.ready();

        // IMPORTANT: use RN backend
        try {
          await tf.setBackend("rn-webgl");
        } catch (e) {
          console.log("could not set rn-webgl backend, using default", e);
        }

        // sometimes helps on RN
        tf.env().set("WEBGL_PACK", false);

        const m = await cocoSsd.load(); // default mobilenet
        setModel(m);
        setTfReady(true);
        setStatus("Model loaded. Ready.");
        setTimeout(() => setStatus(null), 1500);
      } catch (err) {
        console.log("TF init error", err);
        setStatus("Error loading model.");
      }
    })();
  }, []);

  // 3) detection loop
  useEffect(() => {
    let stopped = false;

    async function loop() {
      if (stopped) return;

      try {
        if (running && cameraReady && tfReady && model && camRef.current) {
          // take picture from camera
          const photo = await camRef.current.takePictureAsync({
            quality: 0.35, // a bit lower = faster
            skipProcessing: true,
            base64: false,
          });

          const resp = await fetch(photo.uri);
          const buf = await resp.arrayBuffer();
          const imgTensor = decodeJpeg(new Uint8Array(buf));

          const preds = await model.detect(imgTensor as any);
          // show how many we got
          console.log("COCO-SSD preds:", preds.length);

          const fw = imgTensor.shape[1];
          const fh = imgTensor.shape[0];
          setFrameSize({ w: fw, h: fh });

          const MIN_CONF = 0.7;
          const high = preds
            .filter((p) => p.score >= MIN_CONF)
            .map((p: any) => ({
              name: p.class,
              score: p.score,
              bbox: p.bbox as [number, number, number, number],
            }));

          setDetections(high);

          if (high.length > 0) {
            speakLikeHtml(high, fw, fh, speakStateRef.current);
          }

          imgTensor.dispose?.();
        }
      } catch (err) {
        console.log("detect err:", err);
      } finally {
        // loop
        setTimeout(loop, 700);
      }
    }

    setTimeout(loop, 700);

    return () => {
      stopped = true;
    };
  }, [running, cameraReady, tfReady, model]);

  // permissions UI
  if (camPerm === null) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Requesting camera…</Text>
      </View>
    );
  }
  if (!camPerm.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", marginBottom: 10 }}>Camera permission needed.</Text>
        <TouchableOpacity
          onPress={async () => {
            const p = await Camera.requestCameraPermissionsAsync();
            setCamPerm(p);
          }}
          style={[styles.startButton, { backgroundColor: "#2563eb" }]}
        >
          <Text style={styles.startButtonText}>Grant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* camera */}
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* boxes like canvas */}
      <View style={StyleSheet.absoluteFill}>
        <DetectionBoxes detections={detections} frameW={frameSize.w} frameH={frameSize.h} />
      </View>

      {/* top status */}
      {status ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {/* detection count (tiny, top-left) */}
      <View style={styles.countBar}>
        <Text style={{ color: "#fff", fontSize: 12 }}>
          Detections: {detections.length}
        </Text>
      </View>

      {/* bottom button */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => {
            if (!tfReady || !model) {
              setStatus("Model not ready yet");
              setTimeout(() => setStatus(null), 1500);
              return;
            }
            setRunning((r) => !r);
          }}
          style={[
            styles.startButton,
            { backgroundColor: running ? "#dc2626" : "#2563eb" },
          ]}
        >
          <Text style={styles.startButtonText}>
            {running ? "Stop Detection" : "Start Detection"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- helpers ---------- */

function speakLikeHtml(
  preds: Det[],
  frameW: number,
  frameH: number,
  cache: Record<string, { lastTime: number; lastHeight: number }>
) {
  const now = Date.now();
  const REPEAT_TIME_MS = 10000;
  const CLOSER_FACTOR = 1.2;

  const top = [...preds].sort((a, b) => b.score - a.score).slice(0, 3);

  for (const p of top) {
    const [x, y, w, h] = p.bbox;
    const cx = x + w / 2;
    const dir = getDirectionPhrase(cx, frameW);
    const label = p.name;

    const prev = cache[label];
    let shouldSpeak = false;

    if (!prev) {
      shouldSpeak = true;
    } else {
      const closer = h > prev.lastHeight * CLOSER_FACTOR;
      const timeout = now - prev.lastTime > REPEAT_TIME_MS;
      if (closer || timeout) shouldSpeak = true;
    }

    if (shouldSpeak) {
      Speech.speak(`${label} ${dir}`, { rate: 1.0, language: "en-US" });
      cache[label] = { lastTime: now, lastHeight: h };
    }
  }
}

function getDirectionPhrase(centerX: number, width: number) {
  const left = width * 0.48;
  const right = width * 0.52;
  if (centerX < left) return "on the left, turn right.";
  if (centerX > right) return "on the right, turn left.";
  return "ahead, turn right to avoid.";
}

/* draw boxes */
function DetectionBoxes({
  detections,
  frameW,
  frameH,
}: {
  detections: Det[];
  frameW: number;
  frameH: number;
}) {
  if (!frameW || !frameH) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {detections.map((d, i) => {
        const [x, y, w, h] = d.bbox;
        const scaleX = SCREEN_W / frameW;
        const scaleY = SCREEN_H / frameH;

        const left = x * scaleX;
        const top = y * scaleY;
        const width = w * scaleX;
        const height = h * scaleY;

        return (
          <View key={i} style={[styles.box, { left, top, width, height }]}>
            <View style={styles.labelBg}>
              <Text style={styles.labelText}>
                {d.name} ({Math.round(d.score * 100)}%)
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    position: "absolute",
    top: 20,
    width: SCREEN_W,
    alignItems: "center",
  },
  statusText: {
    backgroundColor: "rgba(0,0,0,0.55)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    fontSize: 13,
  },
  controls: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  startButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  box: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "rgba(255,0,0,0.85)",
  },
  labelBg: {
    position: "absolute",
    top: -22,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  labelText: {
    color: "#fff",
    fontSize: 12,
  },
  countBar: {
    position: "absolute",
    top: 20,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

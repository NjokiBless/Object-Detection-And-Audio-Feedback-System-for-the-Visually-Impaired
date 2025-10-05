import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

/** Detection from the backend. */
export type Item = {
  name: string;
  score: number; // 0..1
  bbox: [number, number, number, number]; // [x1,y1,x2,y2] in model coordinates
  pos: string;   // "left" | "center" | "right"
  prox: string;  // "ahead" | "close" | "very close"
};

type Props = {
  items: Item[];
  /** Model frame size (coordinate space of bbox) */
  frameW: number;
  frameH: number;
  /** Displayed preview size */
  viewW: number;
  viewH: number;
};

function DetectionOverlayBase({ items, frameW, frameH, viewW, viewH }: Props) {
  const sx = frameW > 0 ? viewW / frameW : 1;
  const sy = frameH > 0 ? viewH / frameH : 1;

  return (
    <View pointerEvents="none" style={[styles.overlay, { width: viewW, height: viewH }]}>
      {items?.map((it, idx) => {
        const [x1, y1, x2, y2] = it.bbox;

        // Scale to view space
        const left   = Math.max(0, x1 * sx);
        const top    = Math.max(0, y1 * sy);
        const width  = Math.max(0, (x2 - x1) * sx);
        const height = Math.max(0, (y2 - y1) * sy);

        const pct = Math.round((it.score ?? 0) * 100);
        const label = `${it.name} ${pct}% • ${it.pos} • ${it.prox}`;

        // keep label pill inside right edge (8px margin)
        const overflow = (left + width + 8) - viewW;
        const shiftX = overflow > 0 ? -overflow : 0;

        return (
          <View key={idx} style={[styles.box, { left, top, width, height }]}>
            <View style={[styles.labelWrap, { transform: [{ translateX: shiftX }] }]}>
              <Text numberOfLines={2} style={styles.labelText}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 0, top: 0, zIndex: 10 },
  box: { position: "absolute", borderWidth: 2, borderColor: "#22d3ee", borderRadius: 6 },
  labelWrap: {
    position: "absolute",
    left: 0,
    top: -26,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 260,
  },
  labelText: { color: "#f8fafc", fontSize: 12, fontWeight: "600" },
});

export default memo(DetectionOverlayBase);

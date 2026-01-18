import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ResultTable from "./ResultTable";

export default function HistoryDetailView({
  item,
  onBack,
  onDelete,
}) {
  const rows = useMemo(() => {
    return (
      item?.results ?? [
        { cellType: "Basophil", count: 41, confidence: 0.9, color: "#06b6d4" },
        { cellType: "Eosinophil", count: 42, confidence: 0.9, color: "#7c3aed" },
        { cellType: "Heterophil", count: 44, confidence: 0.9, color: "#2563eb" },
        { cellType: "Lymphocyte", count: 45, confidence: 0.9, color: "#ef4444" },
        { cellType: "Monocyte", count: 45, confidence: 0.9, color: "#ec4899" },
        { cellType: "Thrombocyte", count: 45, confidence: 0.9, color: "#22c55e" },
      ]
    );
  }, [item]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={styles.detailBox}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color="#0F2C42" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item?.title ?? ""}
        </Text>
        <Text style={styles.datetime}>{item?.datetime ?? ""}</Text>

        <View style={styles.previewBox}>
          {!!item?.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.previewImg} />
          ) : (
            <View style={styles.previewImg} />
          )}

          <View style={styles.thumbStrip}>
            <Ionicons name="chevron-back" size={18} color="#111827" />
            <View style={styles.smallThumbRow}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.smallThumb, i === 2 && styles.smallThumbActive]} />
              ))}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <ResultTable rows={rows} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  detailBox: {
    borderWidth: 1.5,
    borderColor: "#2A64A8",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#111827" },
  datetime: { marginTop: 6, fontSize: 11, color: "#6b7280" },

  previewBox: {
    marginTop: 10,
    borderWidth: 1.2,
    borderColor: "#111",
    height: 290,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  previewImg: { width: "100%", height: "100%" },

  thumbStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 54,
    backgroundColor: "rgba(191, 191, 191, 0.85)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  smallThumbRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  smallThumb: { width: 26, height: 26, backgroundColor: "#d1d5db", borderRadius: 3 },
  smallThumbActive: { backgroundColor: "#e5e7eb", borderWidth: 1.2, borderColor: "#111827" },
});

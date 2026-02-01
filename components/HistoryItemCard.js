import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function HistoryItemCard({
  item,
  pendingDelete = false,
  onPress = () => {},
}) {
  const dtText = formatDateTime(item.datetime);
  const displayTitle = (item.note && item.note.trim() !== "") 
    ? item.note 
    : "รอการวิเคราะห์";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        pendingDelete && styles.cardPending,
      ]}
      activeOpacity={0.85}
      onPress={!pendingDelete ? onPress : undefined}
    >
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={2}>
          {item.displayLabel}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.datetime}>{dtText}</Text>

          {!!item.status && (
            <Badge
              text={item.status}
              variant={item.status === "Predict" ? "success" : "warning"}
            />
          )}

          {!!item.stain && (
            <Badge
              text={item.stain}
              variant={item.stain === "Wright" ? "purple" : "danger"}
            />
          )}

          {/* 🔥 ICON แสดงว่ารายการนี้ถูกลบแล้ว รอเน็ต */}
          {pendingDelete && (
            <View style={styles.pendingRow}>
              <Feather name="trash-2" size={12} color="#F59E0B" />
              <Text style={styles.pendingText}>
                Waiting for internet...
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {!!item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function Badge({ text, variant }) {
  const badgeStyle = [
    styles.badge,
    variant === "success" && styles.badgeSuccess,
    variant === "warning" && styles.badgeWarning,
    variant === "danger" && styles.badgeDanger,
    variant === "purple" && styles.badgePurple,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function formatDateTime(isoOrString) {
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return String(isoOrString);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");

    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) hh = 12;

    return `${dd}/${mm}/${yyyy}, ${hh}:${min} ${ampm}`;
  } catch {
    return String(isoOrString);
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: "#2A64A8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  /* 🔥 ตอนรอเน็ต */
  cardPending: {
    opacity: 0.6,
    borderColor: "#F59E0B",
  },

  left: { flex: 1, paddingRight: 10 },
  right: { width: 52, alignItems: "flex-end" },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  datetime: {
    fontSize: 11,
    color: "#6b7280",
    marginRight: 4,
  },

  /* 🔥 pending delete row */
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
  },

  thumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  thumbPlaceholder: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },

  badgeSuccess: { backgroundColor: "#B9F6CA" },
  badgeWarning: { backgroundColor: "#FFD59E" },
  badgeDanger: { backgroundColor: "#FFB3B3" },
  badgePurple: { backgroundColor: "#D6C4FF" },
});

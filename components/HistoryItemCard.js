import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function HistoryItemCard({ item }) {
  const dtText = formatDateTime(item.datetime);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.datetime}>{dtText}</Text>

          <Badge
            text={item.status}
            variant={item.status === "Predict" ? "success" : "warning"}
          />

          <Badge
            text={item.stain}
            variant={item.stain === "Wright" ? "purple" : "danger"}
          />
        </View>
      </View>

      <View style={styles.right}>
        {!!item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>
    </View>
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
  // รองรับทั้ง ISO string หรือ string ปกติ
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
    gap: 8,
    flexWrap: "wrap",
  },
  datetime: {
    fontSize: 11,
    color: "#6b7280",
    marginRight: 4,
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

  badgeSuccess: { backgroundColor: "#B9F6CA" }, // เขียว Predict
  badgeWarning: { backgroundColor: "#FFD59E" }, // ส้ม Pending 
  badgeDanger: { backgroundColor: "#FFB3B3" },  // แดง Giemsa
  badgePurple: { backgroundColor: "#D6C4FF" },  // ม่วง Wright
});

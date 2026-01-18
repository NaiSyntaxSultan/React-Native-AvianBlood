import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ResultTable({ rows = [] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1.4 }]}>Cell Type</Text>
        <Text style={[styles.th, { flex: 0.6, textAlign: "center" }]}>Count</Text>
        <Text style={[styles.th, { flex: 1.2, textAlign: "right" }]}>Confidence</Text>
      </View>

      {rows.map((r, idx) => (
        <View key={idx} style={styles.tr}>
          <Text style={[styles.tdType, { flex: 1.4, color: r.color ?? "#111827" }]}>
            {r.cellType}
          </Text>

          <Text style={[styles.td, { flex: 0.6, textAlign: "center" }]}>{r.count}</Text>

          <View style={[styles.confCell, { flex: 1.2 }]}>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round((r.confidence ?? 0) * 100)}%`,
                    backgroundColor: r.color ?? "#111827",
                  },
                ]}
              />
            </View>

            <Text style={styles.confText}>
              {Math.round((r.confidence ?? 0) * 100)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1.2,
    borderColor: "#2A64A8",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
  },
  th: { fontSize: 12, fontWeight: "800", color: "#111827" },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  tdType: { fontSize: 12, fontWeight: "800" },
  td: { fontSize: 12, fontWeight: "700", color: "#111827" },
  confCell: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  barBg: { width: 70, height: 6, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },
  confText: { fontSize: 12, fontWeight: "800", color: "#111827" },
});

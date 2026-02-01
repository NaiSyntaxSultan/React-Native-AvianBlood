import React, { useEffect, useState } from "react";
import { View, FlatList, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import HistoryItemCard from "../components/HistoryItemCard";
import HistoryDetailView from "../components/HistoryDetailView";

import {
  getLocalUser,
  savePendingDelete,
  getPendingDeletes,
  deletePendingDelete,
} from "../services/sqlite-service";

import {
  getHistoryData,
  deleteHistoryGroup,
} from "../services/firebase-service";

export default function History() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  /* ================= INIT ================= */
  useEffect(() => {
    fetchHistory();

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        await syncPendingDeletes();
        fetchHistory();
      }
    });

    return () => unsubscribe();
  }, []);

  /* ================= FETCH ================= */
  const fetchHistory = async () => {
    try {
      const localUser = getLocalUser();
      if (!localUser?.firebase_id) {
        setItems([]);
        return;
      }

      const data = await getHistoryData(localUser.firebase_id);

      // mark pending delete
      const pending = await getPendingDeletes();
      const pendingIds = pending.map((p) => p.batch_id);

      const mapped = data.map((item) => {
        // 1. พยายามดึงค่า Note จากทุกจุดที่เป็นไปได้
        const rawNote = item.note || (item.Predictions && item.Predictions.note) || (item.predictions && item.predictions.note);
        
        // 2. ตรวจสอบว่ามีข้อความจริงๆ หรือไม่
        const hasNote = rawNote && typeof rawNote === 'string' && rawNote.trim().length > 0;

        // 3. กำหนดข้อความที่จะแสดง
        const displayText = hasNote ? rawNote : "รอการวิเคราะห์";

        return {
          ...item,
          pendingDelete: pendingIds.includes(item.id),
          
          // ✅ FORCE UPDATE: บังคับเปลี่ยนค่า title และ note ให้เป็นข้อความที่ถูกต้อง
          // เพื่อให้ HistoryItemCard แสดงผลแน่นอน
          title: displayText,
          note: displayText,
          displayLabel: displayText
        };
      });
      
      setItems(mapped);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "ไม่สามารถดึงข้อมูลประวัติได้");
    }
  };

  /* ================= AUTOSYNC ================= */
  const syncPendingDeletes = async () => {
    const pending = await getPendingDeletes();

    for (const p of pending) {
      if (!p.batch_id || !p.doc_ids) continue;

      try {
        await deleteHistoryGroup(
          p.batch_id,
          JSON.parse(p.doc_ids)
        );

        setItems((prev) =>
          prev.filter((x) => x.id !== p.batch_id)
        );

        await deletePendingDelete(p.id);
      } catch (err) {
        console.log("Sync delete failed:", p.batch_id);
      }
    }
  };

  /* ================= DELETE ================= */
  const deleteSelected = () => {
    if (!selectedItem) return;

    Alert.alert("Delete", "ต้องการลบรายการนี้ใช่ไหม?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const id = selectedItem.id;
          const docIds = selectedItem.docIds;
          setSelectedItem(null);

          const net = await NetInfo.fetch();

          /* ---------- OFFLINE ---------- */
          if (!net.isConnected) {
            setItems((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, pendingDelete: true } : x
              )
            );

            await savePendingDelete(id, docIds);

            Alert.alert(
              "รอการเชื่อมต่อ",
              "รายการจะถูกลบเมื่อกลับมาออนไลน์"
            );
            return;
          }

          /* ---------- ONLINE ---------- */
          try {
            await deleteHistoryGroup(id, docIds);

            setItems((prev) =>
              prev.filter((x) => x.id !== id)
            );
          } catch (err) {
            await savePendingDelete(id, docIds);

            setItems((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, pendingDelete: true } : x
              )
            );
          }
        },
      },
    ]);
  };

  /* ================= DETAIL ================= */
  if (selectedItem) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <HeaderBar title={"History Detail"} />
        <HistoryDetailView
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
          onDelete={deleteSelected}
        />
        <Navbar />
      </View>
    );
  }

  /* ================= LIST ================= */
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <HeaderBar title={"History"} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 110,
        }}
        renderItem={({ item }) => (
          <HistoryItemCard
            item={item}
            pendingDelete={item.pendingDelete}
            onPress={() =>
              !item.pendingDelete && setSelectedItem(item)
            }
          />
        )}
      />

      <Navbar />
    </View>
  );
}
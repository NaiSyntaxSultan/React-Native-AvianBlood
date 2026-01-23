import React, { useEffect, useState } from "react";
import { View, FlatList, Alert } from "react-native";
import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import HistoryItemCard from "../components/HistoryItemCard";
import HistoryDetailView from "../components/HistoryDetailView";

import { getLocalUser } from "../services/sqlite-service";
import { getHistoryData, deleteHistoryGroup } from "../services/firebase-service";

export default function History() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const localUser = getLocalUser();

      if (localUser && localUser.firebase_id) {
        const data = await getHistoryData(localUser.firebase_id);
        setItems(data);
      } else {
          setItems([]);
       }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "ไม่สามารถดึงข้อมูลประวัติได้");
    }
  };

  const openDetail = (item) => setSelectedItem(item);
  const backToList = () => setSelectedItem(null);

  const deleteSelected = () => {
    if (!selectedItem) return;

    Alert.alert("Delete", "ต้องการลบรายการนี้ใช่ไหม?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHistoryGroup(selectedItem.id, selectedItem.docIds);
            setItems((prev) => prev.filter((x) => x.id !== selectedItem.id));
            setSelectedItem(null);
          } catch (error) {
            console.log(error);
            Alert.alert("Error", "ลบข้อมูลไม่สำเร็จ");
          }
        },
      },
    ]);
  };

  if (selectedItem) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <HeaderBar title={"History Detail"} />
        <HistoryDetailView item={selectedItem} onBack={backToList} onDelete={deleteSelected} />
        <Navbar />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", position: "relative" }}>
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
          <HistoryItemCard item={item} onPress={() => openDetail(item)} />
        )}
      />

      <Navbar />
    </View>
  );
}
import React, { useEffect, useState } from "react";
import { View, FlatList, Alert } from "react-native";

import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import HistoryItemCard from "../components/HistoryItemCard";
import HistoryDetailView from "../components/HistoryDetailView";

const MOCK_HISTORY = [
  {
    id: "1",
    title: "ตรวจหาเม็ดเลือดขาวของไก่ที่ผิดปกติมัย",
    datetime: "12/12/2025, 13:00:00 PM",
    status: "Predict",
    stain: "Wright",
    thumbnailUri: "https://picsum.photos/seed/1/80",
  },
  {
    id: "2",
    title: "ตรวจหาเม็ดเลือดขาวของไก่ที่ผิดปกติมัย",
    datetime: "12/12/2025, 13:00:00 PM",
    status: "Pending",
    stain: "Wright",
    thumbnailUri: "https://picsum.photos/seed/2/80",
  },
  {
    id: "3",
    title: "ตรวจหาเม็ดเลือดขาวของไก่ที่ผิดปกติมัย",
    datetime: "12/12/2025, 13:00:00 PM",
    status: "Predict",
    stain: "Giemsa",
    thumbnailUri: "https://picsum.photos/seed/3/80",
  },
  {
    id: "4",
    title: "ตรวจหาเม็ดเลือดขาวของไก่ที่ผิดปกติมัย",
    datetime: "12/12/2025, 13:00:00 PM",
    status: "Pending",
    stain: "Giemsa",
    thumbnailUri: "https://picsum.photos/seed/4/80",
  },
];

export default function History() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setItems(MOCK_HISTORY);
  }, []);

  const openDetail = (item) => setSelectedItem(item);
  const backToList = () => setSelectedItem(null);

  const deleteSelected = () => {
    if (!selectedItem) return;

    Alert.alert("Delete", "ต้องการลบรายการนี้ใช่ไหม?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setItems((prev) => prev.filter((x) => x.id !== selectedItem.id));
          setSelectedItem(null);
        },
      },
    ]);
  };

  // DETAIL MODE
  if (selectedItem) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <HeaderBar title={"History Detail"} />
        <HistoryDetailView item={selectedItem} onBack={backToList} onDelete={deleteSelected} />
        <Navbar />
      </View>
    );
  }

  // LIST MODE
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

import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import TabBar from "../components/TabBar";
import Navbar from "../components/Navbar";
import HistoryItemCard from "../components/HistoryItemCard";

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

  useEffect(() => {
    setItems(MOCK_HISTORY);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", position: "relative" }}>
      <TabBar text={"History"} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 110,
        }}
        renderItem={({ item }) => <HistoryItemCard item={item} />}
      />

      <Navbar />
    </View>
  );
}

import React, { useEffect, useState } from "react";
import { View, FlatList, Alert } from "react-native";
import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import HistoryItemCard from "../components/HistoryItemCard";
import HistoryDetailView from "../components/HistoryDetailView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase-config";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function History() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("currentUser");
      if (jsonValue) {
        const userData = JSON.parse(jsonValue);
        const userId = userData.id;

        if (userId) {
          const imagesQ = query(
            collection(db, "uploaded_images"), 
            where("user_id", "==", String(userId))
          );
          
          const predictionsQ = query(
            collection(db, "predictions"),
            where("user_id", "==", String(userId))
          );

          const [imagesSnap, predictionsSnap] = await Promise.all([
            getDocs(imagesQ),
            getDocs(predictionsQ)
          ]);

          const predictionMap = {};
          predictionsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.batch_id) {
                predictionMap[data.batch_id] = {
                    id: doc.id,
                    ...data
                };
            }
          });
          
          const groups = {};

          imagesSnap.forEach((doc) => {
            const data = doc.data();
            const groupKey = data.batch_id || doc.id;

            if (!groups[groupKey]) {
              let formattedDate = "";
              let timestamp = data.uploaded_at;
              
              const matchedPrediction = predictionMap[groupKey];
              if (matchedPrediction && matchedPrediction.created_at) {
                  timestamp = matchedPrediction.created_at;
              }

              if (timestamp && timestamp.seconds) {
                 const date = new Date(timestamp.seconds * 1000);
                 const day = date.getDate().toString().padStart(2, '0');
                 const month = (date.getMonth() + 1).toString().padStart(2, '0');
                 const year = date.getFullYear();
                 const hours = date.getHours().toString().padStart(2, '0');
                 const minutes = date.getMinutes().toString().padStart(2, '0');
                 formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}`;
              }

              let title = "รอการวิเคราะห์รูปภาพ";
              let status = data.status || "Pending";
              let stain = "";
              let results = [];
              let note = "";
              let detailData = {}; 

              if (matchedPrediction) {
                  title = matchedPrediction.note || "ผลการวิเคราะห์";
                  status = matchedPrediction.status || "Completed";
                  stain = matchedPrediction.stain_type;
                  note = matchedPrediction.note;
                  
                  if (matchedPrediction.cell_type && Array.isArray(matchedPrediction.cell_type)) {
                      results = matchedPrediction.cell_type.map((type, index) => ({
                          cellType: type,
                          confidence: matchedPrediction.confidence ? matchedPrediction.confidence[index] : 0,
                          count: "-" 
                      }));
                  }
                  
                  detailData = {
                      age: matchedPrediction.age,
                      weight: matchedPrediction.weight,
                      chicken_id: matchedPrediction.chicken_id,
                      total_cells: matchedPrediction.cell_count
                  };
              } else {
                  if (status === "Predict") {
                       title = "กำลังดำเนินการ...";
                  }
              }

              groups[groupKey] = {
                id: groupKey, 
                docIds: [],   
                title: title,
                datetime: formattedDate,
                status: status,
                stain: stain,
                thumbnailUri: data.image_path,
                images: [],
                results: results,
                note: note,
                ...detailData
              };
            }

            groups[groupKey].docIds.push(doc.id);
            
            if (data.image_path) {
              groups[groupKey].images.push(data.image_path);
            }
          });

          const groupedData = Object.values(groups);
          
          groupedData.sort((a, b) => {
              const parseDate = (str) => {
                  if(!str) return new Date(0);
                  const [d, t] = str.split(', ');
                  const [day, month, year] = d.split('/');
                  const [hour, minute] = t.split(':');
                  return new Date(year, month - 1, day, hour, minute);
              };
              return parseDate(b.datetime) - parseDate(a.datetime);
          });

          setItems(groupedData);
        }
      }
    } catch (error) {
      console.log(error);
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
            const deletePromises = selectedItem.docIds.map(docId => 
                deleteDoc(doc(db, "uploaded_images", docId))
            );
            
            if (selectedItem.id) {
                const q = query(
                    collection(db, "predictions"), 
                    where("batch_id", "==", selectedItem.id)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((docSnapshot) => {
                    deletePromises.push(deleteDoc(doc(db, "predictions", docSnapshot.id)));
                });
            }
            
            await Promise.all(deletePromises);

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
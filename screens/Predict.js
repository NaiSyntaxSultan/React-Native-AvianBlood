import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import StainSelector from "../components/StainSelector";
import SelectedImagesGrid from "../components/SelectedImagesGrid";
import PredictionResultsCard from "../components/PredictionResultsCard";
import RecordForm from "../components/RecordForm"; 
import { db } from "../config/firebase-config";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";

const MODE = {
  PREDICT: "PREDICT",
  RECORD: "RECORD",
};

function mockPredictResult(imageId, stainType) {
  const numericId = imageId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = numericId || 1;
  const thromb = (base % 5) + 3;
  const eos = (base % 6) + 2;
  const total = thromb + eos;

  return {
    stainType,
    cellCount: total,
    details: [
      { cellType: "Thrombocyte", count: thromb, confidence: 0.9 },
      { cellType: "Eosinophil", count: eos, confidence: 0.9 },
    ],
  };
}

export default function Predict() {
  const [mode, setMode] = useState(MODE.PREDICT);
  const [stain, setStain] = useState("Wright");
  const [images, setImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [predictedList, setPredictedList] = useState([]);
  const [idx, setIdx] = useState(0);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [recordForm, setRecordForm] = useState({
    chickenId: "",
    ageDays: "",
    weightG: "",
    note: "",
  });

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("currentUser");
        if (!savedUser) return;

        const userData = JSON.parse(savedUser);
        const userId = userData.id;

        if (!userId) return;

        const q = query(
          collection(db, "uploaded_images"),
          where("user_id", "==", String(userId)),
          where("status", "==", "Pending")
        );

        const querySnapshot = await getDocs(q);
        const fetchedImages = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedImages.push({
            id: doc.id,
            uri: data.image_path,
            name: data.original_filename || `img-${doc.id}.jpg`,
            batch_id: data.batch_id,
          });
        });

        setImages(fetchedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกรูปที่ต้องการลบ");
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) => deleteDoc(doc(db, "uploaded_images", id)))
      );

      const remain = images.filter((x) => !selectedIds.includes(x.id));
      setImages(remain);
      setSelectedIds([]);

      if (hasPredicted) {
        const remainPred = predictedList.filter((x) =>
          remain.some((r) => r.id === x.id)
        );
        setPredictedList(remainPred);
        setIdx(0);
        if (remainPred.length === 0) setHasPredicted(false);
      }
    } catch (error) {
      console.error("Error deleting images:", error);
      Alert.alert("Error", "ไม่สามารถลบภาพจากฐานข้อมูลได้");
    }
  };

  const predictSelected = () => {
    if (selectedIds.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกรูปที่ต้องการทำนาย");
      return;
    }

    const selectedImages = images.filter((img) => selectedIds.includes(img.id));
    if (selectedImages.length === 0) {
      Alert.alert("แจ้งเตือน", "ไม่พบรูปที่เลือก");
      return;
    }

    const predicted = selectedImages.map((img) => ({
      ...img,
      result: mockPredictResult(img.id, stain),
      batch_id: img.batch_id,
    }));

    setPredictedList(predicted);
    setHasPredicted(true);
    setIdx(0);

    Alert.alert("Predict", `ทำนาย ${selectedImages.length} รูป`);
  };

  const current =
    predictedList[Math.min(idx, Math.max(predictedList.length - 1, 0))];

  const resultCardData = useMemo(() => {
    const cellCount = current?.result?.cellCount ?? "-";
    const d0 = current?.result?.details?.[0];
    const d1 = current?.result?.details?.[1];

    return {
      imageName: current?.name ?? "-",
      previewUri: current?.uri ?? "https://picsum.photos/seed/empty/200",
      pageText: predictedList.length
        ? `${idx + 1}/${predictedList.length}`
        : "0/0",
      summary: [
        { label: "Cell Count:", value: String(cellCount) },
        {
          label: d0?.cellType ?? "Thrombocyte",
          value: String(d0?.count ?? "-"),
        },
        {
          label: d1?.cellType ?? "Eosinophil",
          value: String(d1?.count ?? "-"),
        },
      ],
    };
  }, [current, idx, predictedList.length]);

  const goToRecordMode = () => {
    if (!hasPredicted || predictedList.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณากด Predict ก่อน");
      return;
    }

    const payload = {
      stainType: stain,
      imageCount: predictedList.length,
      batchId: predictedList[0]?.batch_id || null,
      images: predictedList.map((img) => ({
        id: img.id,
        name: img.name,
        uri: img.uri,
      })),
      predictions: predictedList.map((img) => ({
        imageId: img.id,
        imageName: img.name,
        stainType: img.result?.stainType ?? stain,
        cellCount: img.result?.cellCount ?? 0,
        cells: (img.result?.details ?? []).map((c) => ({
          type: c.cellType,
          count: c.count,
          confidence: c.confidence,
        })),
      })),
    };

    setPendingPayload(payload);
    setMode(MODE.RECORD);
  };

  const backToPredictMode = () => setMode(MODE.PREDICT);

  const saveRecordToDB = async () => {
    if (!pendingPayload) {
      Alert.alert("Error", "ไม่พบข้อมูลผลทำนาย");
      return;
    }
    if (!recordForm.chickenId.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอก Name/Chicken ID");
      return;
    }

    try {
      const savedUser = await AsyncStorage.getItem("currentUser");
      const userData = savedUser ? JSON.parse(savedUser) : {};
      const userId = userData.id;

      if (!userId) {
        Alert.alert("Error", "ไม่พบข้อมูลผู้ใช้");
        return;
      }

      const predictionsRef = collection(db, "predictions");
      const snapshot = await getDocs(predictionsRef);
      const newId = snapshot.size + 1;

      let totalCellCount = 0;
      let allCellTypes = [];
      let allConfidences = [];

      pendingPayload.predictions.forEach((p) => {
        totalCellCount += p.cellCount;
        p.cells.forEach((c) => {
          if (!allCellTypes.includes(c.type)) {
            allCellTypes.push(c.type);
          }
          allConfidences.push(c.confidence);
        });
      });

      const finalObject = {
        id: newId,
        user_id: String(userId),
        stain_type: pendingPayload.stainType,
        number_of_predicted: pendingPayload.imageCount,
        status: "Completed",
        created_at: serverTimestamp(),
        batch_id: pendingPayload.batchId,
        cell_count: totalCellCount,
        cell_type: allCellTypes,
        confidence: allConfidences,
        chicken_id: recordForm.chickenId.trim(),
        age: recordForm.ageDays ? Number(recordForm.ageDays) : null,
        weight: recordForm.weightG ? Number(recordForm.weightG) : null,
        note: recordForm.note.trim(),
      };

      await addDoc(predictionsRef, finalObject);

      const batch = writeBatch(db);
      pendingPayload.images.forEach((img) => {
        const imgRef = doc(db, "uploaded_images", img.id);
        batch.update(imgRef, { status: "Predict" });
      });
      await batch.commit();

      Alert.alert("Success", "บันทึกเสร็จสิ้น ✅");

      const savedIds = pendingPayload.images.map((img) => img.id);
      setImages((prev) => prev.filter((img) => !savedIds.includes(img.id)));

      setSelectedIds([]);
      setPredictedList([]);
      setHasPredicted(false);
      setIdx(0);

      setMode(MODE.PREDICT);
      setPendingPayload(null);
      setRecordForm({ chickenId: "", ageDays: "", weightG: "", note: "" });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  if (mode === MODE.RECORD) {
    return (
      <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
        <HeaderBar title={"Record"} />
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          <RecordForm 
            selectedImages={pendingPayload?.images || []}
            form={recordForm}
            setForm={setRecordForm}
            onSave={saveRecordToDB}
            onBack={backToPredictMode}
          />
        </ScrollView>
        <Navbar />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
      <HeaderBar title={"Prediction"} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <StainSelector stain={stain} onChange={setStain} />

        <SelectedImagesGrid
          images={images}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDeleteSelected={deleteSelected}
        />

        <TouchableOpacity
          style={[
            styles.predictBtn,
            selectedIds.length === 0 && styles.predictBtnDisabled,
          ]}
          onPress={predictSelected}
          activeOpacity={0.9}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.predictText}>
            Predict ({selectedIds.length})
          </Text>
        </TouchableOpacity>

        {hasPredicted && (
          <PredictionResultsCard
            stain={stain}
            result={resultCardData}
            totalCount={predictedList.length}
            onPrev={() => setIdx((p) => Math.max(p - 1, 0))}
            onNext={() =>
              setIdx((p) =>
                Math.min(p + 1, Math.max(predictedList.length - 1, 0))
              )
            }
            onSaveAll={goToRecordMode}
          />
        )}
      </ScrollView>
      <Navbar />
    </View>
  );
}

const styles = StyleSheet.create({
  predictBtn: {
    marginTop: 16,
    marginHorizontal: 50,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  predictBtnDisabled: { opacity: 0.6 },
  predictText: { color: "#fff", fontWeight: "900" },
});
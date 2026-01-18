import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";

import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import StainSelector from "../components/StainSelector";
import SelectedImagesGrid from "../components/SelectedImagesGrid";
import PredictionResultsCard from "../components/PredictionResultsCard";
import { db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const MOCK_IMAGES = Array.from({ length: 9 }).map((_, i) => ({
  id: String(i + 1),
  uri: `https://picsum.photos/seed/predict_${i + 1}/200`,
  name: `image_${i + 1}.png`,
}));

const MODE = {
  PREDICT: "PREDICT",
  RECORD: "RECORD",
};

// mock ผลทำนายต่อรูป
function mockPredictResult(imageId, stainType) {
  const base = Number(imageId) || 1;
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
  const [images, setImages] = useState(MOCK_IMAGES);

  //selection ใช้กับลบและเลือกภาพเพื่อ predict 
  const [selectedIds, setSelectedIds] = useState([]);

  // แสดงผลทำนาย โชว์หลัง predict
  const [hasPredicted, setHasPredicted] = useState(false);
  const [predictedList, setPredictedList] = useState([]);
  const [idx, setIdx] = useState(0);

  // payload ที่จะส่งไป Record mode
  const [pendingPayload, setPendingPayload] = useState(null);

  // แบบฟอร์ม record 
  const [recordForm, setRecordForm] = useState({
    chickenId: "",
    ageDays: "",
    weightG: "",
    note: "",
  });

  // selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกรูปที่ต้องการลบ");
      return;
    }

    const remain = images.filter((x) => !selectedIds.includes(x.id));
    setImages(remain);

    // ล้าง selection
    setSelectedIds([]);

    // ถ้าเคย predict แล้ว ให้ sync predictedList ด้วย
    if (hasPredicted) {
      const remainPred = predictedList.filter((x) =>
        remain.some((r) => r.id === x.id)
      );
      setPredictedList(remainPred);
      setIdx(0);
      if (remainPred.length === 0) setHasPredicted(false);
    }
  };

  // Predict เฉพาะรูปที่เลือก
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
    }));

    setPredictedList(predicted);
    setHasPredicted(true);
    setIdx(0);

    Alert.alert("Predict", `ทำนาย ${selectedImages.length} รูป`);
  };

  const current =
    predictedList[Math.min(idx, Math.max(predictedList.length - 1, 0))];

  // ข้อมูลสำหรับ PredictionResultsCard ทีละรูป
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

  // กด save แล้ว -> ไป Record mode
  const goToRecordMode = () => {
    if (!hasPredicted || predictedList.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณากด Predict ก่อน");
      return;
    }

    const payload = {
      stainType: stain,
      imageCount: predictedList.length,

      images: predictedList.map((img) => ({
        id: img.id,
        name: img.name,
        uri: img.uri,
      })),

      predictions: predictedList.map((img) => ({
        imageId: img.id,
        imageName: img.name,
        stainType: img.result?.stainType ?? stain,
        cellCount: img.result?.cellCount ?? null,
        cells: (img.result?.details ?? []).map((c) => ({
          type: c.cellType,
          count: c.count,
          confidence: c.confidence,
        })),
      })),

      createdAt: new Date().toISOString(),
    };

    console.log("PENDING PAYLOAD:", payload);

    setPendingPayload(payload);
    setMode(MODE.RECORD);
  };

  const backToPredictMode = () => setMode(MODE.PREDICT);

  // -------------------- Record Save -> Firestore --------------------
  const saveRecordToDB = async () => {
    if (!pendingPayload) {
      Alert.alert("Error", "ไม่พบข้อมูลผลทำนาย");
      return;
    }
    if (!recordForm.chickenId.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอก Name/Chicken ID");
      return;
    }

    const finalObject = {
      ...pendingPayload,
      record: {
        chickenId: recordForm.chickenId.trim(),
        ageDays: recordForm.ageDays ? Number(recordForm.ageDays) : null,
        weightG: recordForm.weightG ? Number(recordForm.weightG) : null,
        note: recordForm.note.trim(),
      },
      savedAt: serverTimestamp(),
    };

    console.log("FINAL OBJECT (WRITE TO FIRESTORE):", finalObject);

    try {
      await addDoc(collection(db, "records"), finalObject);
      Alert.alert("Success", "บันทึกเสร็จสิ้น ✅");

      // เอารูปที่ save แล้วออกจากหน้า prediction
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

  // RECORD MODE
  if (mode === MODE.RECORD) {
    return (
      <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
        <HeaderBar title={"Record"} />

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
          <TouchableOpacity
            onPress={backToPredictMode}
            style={styles.backRow}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.recordCard}>
            <Text style={styles.recordTitle}>Results of the Analysis</Text>

            <View style={styles.gridWrap}>
              {pendingPayload?.images?.slice(0, 9).map((img) => (
                <View key={img.id} style={styles.gridItem}>
                  <View style={styles.thumbBox} />
                  <Text style={styles.imgName} numberOfLines={1}>
                    {img.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Name/Chicken ID</Text>
            <TextInput
              value={recordForm.chickenId}
              onChangeText={(t) =>
                setRecordForm((p) => ({ ...p, chickenId: t }))
              }
              placeholder="e.g., AC_HET01, Broiler Chicken"
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Age (days)</Text>
                <TextInput
                  value={recordForm.ageDays}
                  onChangeText={(t) =>
                    setRecordForm((p) => ({ ...p, ageDays: t }))
                  }
                  placeholder="17"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Weight (g)</Text>
                <TextInput
                  value={recordForm.weightG}
                  onChangeText={(t) =>
                    setRecordForm((p) => ({ ...p, weightG: t }))
                  }
                  placeholder="34"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Note</Text>
            <TextInput
              value={recordForm.note}
              onChangeText={(t) => setRecordForm((p) => ({ ...p, note: t }))}
              style={[styles.input, { height: 120, textAlignVertical: "top" }]}
              multiline
            />

            <TouchableOpacity
              style={styles.saveShareBtn}
              onPress={saveRecordToDB}
              activeOpacity={0.9}
            >
              <Text style={styles.saveShareText}>Save & Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Navbar />
      </View>
    );
  }

  // PREDICT MODE
  return (
    <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
      <HeaderBar title={"Prediction"} />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <StainSelector stain={stain} onChange={setStain} />

        {/* เลือกรูป (ใช้กับลบ และ Predict) */}
        <SelectedImagesGrid
          images={images}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDeleteSelected={deleteSelected}
        />

        {/* Predict เฉพาะรูปที่เลือก */}
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

        {/* แสดงผลหลัง predict เท่านั้น */}
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
            onSaveAll={goToRecordMode} // กด save -> ไป Record mode
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

  backRow: { marginBottom: 10 },
  backText: { fontWeight: "900", color: "#0F2C42" },

  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  recordTitle: {
    textAlign: "center",
    fontWeight: "900",
    color: "#0F2C42",
    marginBottom: 12,
  },

  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "30%", marginBottom: 12 },
  thumbBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
  },
  imgName: { marginTop: 6, fontSize: 10, color: "#6b7280" },

  formCard: {
    marginTop: 14,
    backgroundColor: "#bfe6ff",
    borderRadius: 18,
    padding: 14,
  },
  label: {
    fontWeight: "800",
    color: "#0091ff",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  saveShareBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  saveShareText: { color: "#fff", fontWeight: "900" },
});

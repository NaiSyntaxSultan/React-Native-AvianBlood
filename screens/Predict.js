import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from "react-native";

import NetInfo from "@react-native-community/netinfo";

import Navbar from "../components/Navbar";
import HeaderBar from "../components/HeaderBar";
import StainSelector from "../components/StainSelector";
import SelectedImagesGrid from "../components/SelectedImagesGrid";
import PredictionResultsCard from "../components/PredictionResultsCard";
import RecordForm from "../components/RecordForm";

import {
  getLocalUser,
  savePendingDeleteImage,
  savePendingPredict,
  getPendingDeletes,
  getPendingPredicts,
  deletePendingDelete,
  deletePendingPredict,
} from "../services/sqlite-service";

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

// ✅ ประกาศตัวแปร Global Lock ไว้นอก Component (สำคัญมาก! เพื่อกัน Sync ซ้อนข้ามหน้าจอ)
let isGlobalSyncing = false;

function mockPredictResult(imageId, stainType) {
  const numericId = imageId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const thromb = (numericId % 5) + 3;
  const eos = (numericId % 6) + 2;

  return {
    stainType,
    cellCount: thromb + eos,
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
  const [isOnline, setIsOnline] = useState(true);

  // States
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [recordForm, setRecordForm] = useState({
    chickenId: "",
    ageDays: "",
    weightG: "",
    note: "",
  });

  // ฟังก์ชัน Sync ข้อมูล (ใช้ Global Lock)
  const performAutoSync = async () => {
    // 🔒 ล็อคด้วยตัวแปร Global ทันที
    if (isGlobalSyncing) return;
    isGlobalSyncing = true;

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) return;

      const pendingDeletes = await getPendingDeletes();
      const pendingPredicts = await getPendingPredicts();

      // ถ้าไม่มีงานค้างให้จบเลย
      if (pendingDeletes.length === 0 && pendingPredicts.length === 0) return;

      setIsAutoSyncing(true); // โชว์แถบเหลือง

      // 1. Sync การลบรูป
      for (const d of pendingDeletes) {
        try {
          if (d.image_id) {
            await deleteDoc(doc(db, "Uploaded_images", d.image_id));
            await deletePendingDelete(d.id);
          }
        } catch (e) {
          console.warn("Delete sync error", e);
        }
      }

      // 2. Sync การทำนาย
      for (const p of pendingPredicts) {
        try {
          const payload = JSON.parse(p.payload);
          let isDuplicate = false;

          // เช็คซ้ำใน Firebase ก่อนบันทึก
          if (payload.batch_id) {
            const qCheck = query(
              collection(db, "Predictions"),
              where("batch_id", "==", payload.batch_id)
            );
            const snapCheck = await getDocs(qCheck);
            if (!snapCheck.empty) {
              isDuplicate = true;
              console.log("AutoSync: ข้ามการบันทึกซ้ำสำหรับ batch:", payload.batch_id);
            }
          }

          // ถ้าไม่ซ้ำ ถึงจะบันทึก
          if (!isDuplicate) {
            await addDoc(collection(db, "Predictions"), {
              ...payload,
              status: "Completed",
              created_at: serverTimestamp(),
            });

            const batch = writeBatch(db);
            payload.images.forEach((id) => {
              batch.update(doc(db, "Uploaded_images", id), {
                status: "Predict",
              });
            });
            await batch.commit();
          }

          // ✅ ลบออกจาก SQLite เสมอ (เมื่อจบกระบวนการ ไม่ว่าจะบันทึกใหม่ หรือข้ามเพราะซ้ำ)
          await deletePendingPredict(p.id);
          
        } catch (e) {
          console.warn("Predict sync error", e);
          // กรณี Error จะไม่ลบออกจาก SQLite เพื่อให้รอบหน้ามาลองใหม่
        }
      }
    } catch (err) {
      console.error("AutoSync Error:", err);
    } finally {
      // 🔓 ปลดล็อค Global เมื่อเสร็จสิ้นภารกิจ
      isGlobalSyncing = false;
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => {
    performAutoSync();
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      if (online) {
        performAutoSync();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const user = getLocalUser();
      if (!user?.firebase_id) return;

      const q = query(
        collection(db, "Uploaded_images"),
        where("firebase_id", "==", String(user.firebase_id)),
        where("status", "==", "Pending")
      );

      const snap = await getDocs(q);
      const list = [];

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          uri: d.image_path,
          name: d.original_filename || docSnap.id,
          batch_id: d.batch_id || null,
        });
      });

      setImages(list);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "โหลดรูปไม่สำเร็จ");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;

    const user = getLocalUser();

    if (!isOnline) {
      for (const id of selectedIds) {
        await savePendingDeleteImage({
          firebase_id: user.firebase_id,
          image_id: id,
        });
      }
    } else {
      await Promise.all(
        selectedIds.map((id) => deleteDoc(doc(db, "Uploaded_images", id)))
      );
    }

    setImages((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  };

  const predictSelected = () => {
    if (!selectedIds.length) return;

    const selected = images.filter((i) => selectedIds.includes(i.id));
    setPredictedList(
      selected.map((img) => ({
        ...img,
        result: mockPredictResult(img.id, stain),
      }))
    );

    setHasPredicted(true);
    setIdx(0);
  };

  const current = predictedList[idx];

  const resultCardData = useMemo(() => {
    if (!current) return null;
    return {
      imageName: current.name,
      previewUri: current.uri,
      pageText: `${idx + 1}/${predictedList.length}`,
      summary: [
        { label: "Cell Count", value: current.result.cellCount },
        ...current.result.details.map((d) => ({
          label: d.cellType,
          value: d.count,
        })),
      ],
    };
  }, [current, idx, predictedList.length]);

  const goToRecordMode = () => {
    setPendingPayload({ images: predictedList });
    setMode(MODE.RECORD);
  };

  const saveRecordToDB = async () => {
    if (isSaving) return; 
    if (!pendingPayload?.images?.length) {
      Alert.alert("Error", "ไม่พบข้อมูลที่ต้องบันทึก");
      return;
    }

    const user = getLocalUser();
    if (!user) return;

    setIsSaving(true);

    try {
      let refBatchId = pendingPayload.images.length > 0 ? pendingPayload.images[0].batch_id : null;
      if (!refBatchId) {
         refBatchId = `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const payload = {
        firebase_id: user.firebase_id,
        stain_type: stain,
        chicken_id: recordForm.chickenId,
        age: Number(recordForm.ageDays),
        weight: Number(recordForm.weightG),
        note: recordForm.note,
        images: pendingPayload.images.map((i) => i.id),
        batch_id: refBatchId, 
      };

      if (!isOnline) {
        // บันทึกออฟไลน์
        await savePendingPredict(user.firebase_id, payload);
        Alert.alert("บันทึกออฟไลน์", "ข้อมูลจะ Sync เมื่อออนไลน์");
      } else {
        // บันทึกออนไลน์ (เช็คซ้ำด้วย)
        let isDuplicate = false;
        if (payload.batch_id) {
            const qCheck = query(
              collection(db, "Predictions"),
              where("batch_id", "==", payload.batch_id)
            );
            const snapCheck = await getDocs(qCheck);
            if (!snapCheck.empty) {
              isDuplicate = true;
            }
        }

        if (isDuplicate) {
            console.log("Online Save: Duplicate found, skipping.");
            Alert.alert("แจ้งเตือน", "ข้อมูลชุดนี้ถูกบันทึกไปแล้ว"); 
        } else {
            await addDoc(collection(db, "Predictions"), {
              ...payload,
              status: "Completed",
              created_at: serverTimestamp(),
            });

            const batch = writeBatch(db);
            payload.images.forEach((id) => {
              batch.update(doc(db, "Uploaded_images", id), {
                status: "Predict",
              });
            });
            await batch.commit();
            Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว");
        }
      }

      setImages((prev) => prev.filter((i) => !payload.images.includes(i.id)));
      setHasPredicted(false);
      setPredictedList([]);
      setSelectedIds([]);
      setMode(MODE.PREDICT);

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === MODE.RECORD) {
    return (
      <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
        <HeaderBar title="Record" />
        <ScrollView>
          <RecordForm
            selectedImages={pendingPayload?.images || []}
            form={recordForm}
            setForm={setRecordForm}
            onSave={saveRecordToDB}
            onBack={() => !isSaving && setMode(MODE.PREDICT)}
          />
        </ScrollView>
        <Navbar />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#cfe9f9" }}>
      <HeaderBar title="Prediction" />

      {isAutoSyncing && (
        <View
          style={{
            backgroundColor: "#FFD700",
            padding: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "black" }}>
            ⚡ กำลังซิงค์ข้อมูลการทำนาย...
          </Text>
        </View>
      )}

      <ScrollView>
        <StainSelector stain={stain} onChange={setStain} />

        <SelectedImagesGrid
          images={images}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDeleteSelected={deleteSelected}
        />

        <TouchableOpacity style={styles.predictBtn} onPress={predictSelected}>
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
              setIdx((p) => Math.min(p + 1, predictedList.length - 1))
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
    margin: 20,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  predictText: {
    color: "#fff",
    fontWeight: "900",
  },
});
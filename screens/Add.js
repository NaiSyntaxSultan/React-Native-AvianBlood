import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Pressable,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Navbar from "../components/Navbar";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import HeaderBar from "../components/HeaderBar";

import NetInfo from "@react-native-community/netinfo";

import {
  getLocalUser,
  savePendingUpload,
  getPendingUploads,
  deletePendingUpload,
} from "../services/sqlite-service";
import { saveUploadedImage } from "../services/firebase-service";

const Add = () => {
  const [pressed, setPressed] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ✅ เพิ่ม state นี้ให้ JSX ใช้งานได้ (ไม่เปลี่ยน UI)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const isAutoSyncingRef = useRef(false);

  const formatSize = (bytes) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const performAutoSync = async () => {
    if (isAutoSyncingRef.current) return;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    const pendingItems = await getPendingUploads();
    if (pendingItems.length === 0) return;

    isAutoSyncingRef.current = true;
    setIsAutoSyncing(true);

    const processedFiles = new Set();

    for (const item of pendingItems) {
      if (processedFiles.has(item.original_filename)) {
        await deletePendingUpload(item.id);
        continue;
      }

      try {
        await saveUploadedImage({
          firebase_id: item.firebase_id,
          image_path: item.image_path,
          original_filename: item.original_filename,
          batch_id: item.batch_id,
        });

        processedFiles.add(item.original_filename);
        await deletePendingUpload(item.id);

        setFiles((currentFiles) =>
          currentFiles.filter((f) => f.name !== item.original_filename)
        );
      } catch (error) {
        console.log("AutoSync processing error for item:", item.id);
      }
    }

    isAutoSyncingRef.current = false;
    setIsAutoSyncing(false);
  };

  useEffect(() => {
    performAutoSync();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        performAutoSync();
      }
    });
    return () => unsubscribe();
  }, []);

  const uploadFilesToFirebase = async (filesToUpload) => {
    if (uploading) return;
    setUploading(true);

    let userId = null;
    try {
      const localUser = getLocalUser();
      if (localUser && localUser.firebase_id) {
        userId = localUser.firebase_id;
      } else {
        Alert.alert("Error", "ไม่พบข้อมูลผู้ใช้งาน กรุณา Login ใหม่");
        setUploading(false);
        return;
      }
    } catch (e) {
      setUploading(false);
      return;
    }

    setFiles((currentFiles) =>
      currentFiles.map((f) =>
        filesToUpload.some((u) => u.id === f.id)
          ? { ...f, status: "uploading" }
          : f
      )
    );

    const batchId = Date.now().toString();
    const pendingItems = await getPendingUploads();

    let successCount = 0;
    let offlineCount = 0;

    for (const file of filesToUpload) {
      const isAlreadyPending = pendingItems.some(
        (item) => item.original_filename === file.name
      );

      if (isAlreadyPending) {
        setFiles((curr) =>
          curr.map((f) =>
            f.id === file.id ? { ...f, status: "saved_offline" } : f
          )
        );
        continue;
      }

      const netState = await NetInfo.fetch();

      try {
        if (netState.isConnected) {
          await saveUploadedImage({
            firebase_id: userId,
            image_path: file.base64,
            original_filename: file.name,
            batch_id: batchId,
          });

          successCount++;
          setFiles((curr) => curr.filter((f) => f.id !== file.id));
        } else {
          throw new Error("Offline");
        }
      } catch {
        await savePendingUpload({
          firebase_id: userId,
          image_path: file.base64,
          original_filename: file.name,
          batch_id: batchId,
        });

        offlineCount++;
        setFiles((curr) =>
          curr.map((f) =>
            f.id === file.id ? { ...f, status: "saved_offline" } : f
          )
        );
      }
    }

    setUploading(false);

    Alert.alert(
      "ผลลัพธ์",
      `อัปโหลดสำเร็จ: ${successCount}\nบันทึกออฟไลน์: ${offlineCount}`
    );
  };

  const handleUploadBtn = () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;
    uploadFilesToFirebase(pendingFiles);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 100,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map((asset) => ({
        id:
          Date.now().toString() +
          "_" +
          Math.random().toString(36).substr(2, 9),
        uri: asset.uri,
        base64: `data:image/jpeg;base64,${asset.base64}`,
        name: asset.fileName || asset.uri.split("/").pop(),
        size: asset.fileSize || 0,
        progress: 0,
        status: "pending",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <LinearGradient colors={["#E9E5E5", "#B8E1F8"]} style={{ flex: 1 }}>
      <HeaderBar title={"Upload files"} />

      {isAutoSyncing && (
        <View
          style={{
            backgroundColor: "#FFD700",
            padding: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "black" }}>
            ⚡ กำลังอัปโหลดรูปที่ค้างในระบบ...
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Pressable
          onPress={openGallery}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{
            width: 350,
            height: 180,
            backgroundColor: pressed ? "#EEF4FF" : "#fff",
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
            alignSelf: "center",
            marginTop: 82,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Entypo name="upload-to-cloud" size={75} color="#5686E1" />
          <Text style={{ fontSize: 14, marginBottom: 7 }}>Upload Image</Text>
          <Text style={{ fontSize: 14, color: "#898989" }}>
            Support: .jpg, .png (Max 1 MB)
          </Text>
          <Text style={{ fontSize: 14, color: "#898989" }}>
            Max 100 images
          </Text>
        </Pressable>

        {files.map((file) => (
          <View
            key={file.id}
            style={{
              width: 350,
              height: 75,
              backgroundColor: "#F3F3F3",
              borderRadius: 16,
              marginTop: 15,
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Image
              source={{ uri: file.uri }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                backgroundColor: "#ddd",
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600" }}
                numberOfLines={1}
              >
                {file.name}
              </Text>

              {file.status === "uploading" ? (
                <Text style={{ fontSize: 12, color: "#5686E1" }}>
                  Uploading...
                </Text>
              ) : file.status === "saved_offline" ? (
                <Text style={{ fontSize: 12, color: "#F59E0B" }}>
                  Waiting for internet...
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: "#898989" }}>
                  {formatSize(file.size)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => removeFile(file.id)}
              disabled={file.status === "uploading"}
            >
              <Feather name="x" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        ))}

        {files.length > 0 && (
          <TouchableOpacity
            style={{
              width: 345,
              height: 45,
              backgroundColor: pendingCount > 0 ? "#5686E1" : "#989898",
              borderRadius: 16,
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 20,
              marginBottom: 10,
              opacity: uploading ? 0.7 : 1,
            }}
            onPress={handleUploadBtn}
            disabled={pendingCount === 0 || uploading}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {uploading
                ? "Uploading..."
                : pendingCount > 0
                ? `Upload ${pendingCount} file`
                : "Uploaded"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Navbar />
    </LinearGradient>
  );
};

export default Add;

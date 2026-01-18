import React, { useState } from "react";
import { Text, View, Pressable, Alert, Platform, Image, ScrollView, TouchableOpacity, Linking } from "react-native";
import Navbar from "../components/Navbar";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import { Feather } from "@expo/vector-icons"; 
import * as ImagePicker from "expo-image-picker";
import HeaderBar from "../components/HeaderBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

const Add = () => {
  const [pressed, setPressed] = useState(false);
  const [files, setFiles] = useState([]); 
  const [uploading, setUploading] = useState(false);

  const formatSize = (bytes) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const uploadFilesToFirebase = async (filesToUpload) => {
    if (uploading) return;
    setUploading(true);

    let userId = null;
    try {
        const jsonValue = await AsyncStorage.getItem("currentUser"); 
        if (jsonValue) {
            const userData = JSON.parse(jsonValue);
            userId = userData.id;
        }

        if (!userId) {
            Alert.alert("Error", "ไม่พบข้อมูล User ID");
            setUploading(false);
            return;
        }
    } catch (e) {
        console.log("Error reading user data:", e);
        setUploading(false);
        return;
    }

    setFiles((currentFiles) =>
      currentFiles.map((f) => {
        if (filesToUpload.some(uploadFile => uploadFile.id === f.id)) {
            return { ...f, status: "uploading" };
        }
        return f;
      })
    );

    const batchId = Date.now().toString();

    let successCount = 0;
    
    let currentIdCounter = 1;
    try {
        const snapshot = await getDocs(collection(db, "uploaded_images"));
        currentIdCounter = snapshot.size + 1;
    } catch (err) {
        console.log(err);
    }

    for (const file of filesToUpload) {
      try {
        await addDoc(collection(db, "uploaded_images"), {
            id: currentIdCounter, 
            user_id: userId,
            image_path: file.base64, 
            original_filename: file.name,
            batch_id: batchId, 
            uploaded_at: serverTimestamp(),
        });

        currentIdCounter++;
        successCount++;

        setFiles((currentFiles) =>
          currentFiles.map((f) => {
            if (f.id === file.id) {
               return { ...f, progress: 1, status: "completed" };
            }
            return f;
          })
        );
        
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        console.error("Save Error:", err);
        setFiles((currentFiles) =>
            currentFiles.map((f) => {
              if (f.id === file.id) {
                return { ...f, status: "pending" };
              }
              return f;
            })
          );
      }
    }

    setUploading(false);

    if (successCount > 0) {
      Alert.alert(
          "สำเร็จ", 
          `บันทึกข้อมูลเรียบร้อยจำนวน ${successCount} รายการ`,
          [
              { 
                  text: "ตกลง", 
                  onPress: () => {
                      setFiles([]); 
                  }
              }
          ]
      );
    } else {
      Alert.alert("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ (ไฟล์อาจใหญ่เกินไป)");
    }
  };

  const handleUploadBtn = () => {
    const pendingFiles = files.filter(f => f.status === "pending");
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

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsMultipleSelection: true,
        selectionLimit: 100, 
        quality: 0.3, 
        base64: true,
      });

      if (!result.canceled) {
        const validAssets = [];
        const duplicateNames = [];
        const oversizeFiles = []; 

        result.assets.forEach((asset) => {
          let assetName = asset.fileName;
          if (!assetName) {
             const uriParts = asset.uri.split('/');
             assetName = uriParts[uriParts.length - 1]; 
          }

          if (asset.base64 && asset.base64.length > 1048487) {
             oversizeFiles.push(assetName);
             return; 
          }

          const isDuplicate = files.some(existingFile => existingFile.name === assetName);

          if (isDuplicate) {
            duplicateNames.push(assetName);
          } else {
            const base64String = `data:image/jpeg;base64,${asset.base64}`;

            validAssets.push({
              originalAsset: asset,
              name: assetName,
              base64: base64String
            });
          }
        });

        if (oversizeFiles.length > 0) {
            Alert.alert(
                "บางไฟล์มีขนาดใหญ่เกินไป", 
                `ไฟล์เหล่านี้มีขนาดเกิน 1 MB และจะไม่ถูกเพิ่ม:\n\n${oversizeFiles.join('\n')}`
            );
        }

        if (duplicateNames.length > 0) {
            Alert.alert("พบไฟล์ซ้ำ!", `ไฟล์เหล่านี้มีชื่อซ้ำ:\n\n${duplicateNames.join('\n')}`);
        }

        if (validAssets.length === 0) return;

        const newFiles = validAssets.map((item) => ({
          id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9),
          uri: item.originalAsset.uri,
          base64: item.base64,
          name: item.name, 
          size: item.originalAsset.fileSize || 0, 
          progress: 0,
          status: "pending",
        }));

        setFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.log(error); 
      Alert.alert("Error", "เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const pendingCount = files.filter(f => f.status === "pending").length;

  return (
    <LinearGradient colors={["#E9E5E5", "#B8E1F8"]} style={{ flex: 1 }}>

      <HeaderBar title={"Upload files"} />

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
          <Text style={{ fontSize: 14, color: "#898989" }}>Max 100 images</Text>
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
              style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: '#ddd' }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }} numberOfLines={1}>
                {file.name}
              </Text>

              {file.status === "uploading" ? (
                <View>
                  <Text style={{ fontSize: 12, color: "#5686E1" }}>Uploading...</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: "#898989" }}>
                  {formatSize(file.size)}
                </Text>
              )}
            </View>

            <View style={{ marginLeft: 10 }}>
              {file.status === "completed" ? (
                <View style={{ backgroundColor: '#000', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="check" size={14} color="#fff" />
                </View>
              ) : (
                <TouchableOpacity onPress={() => removeFile(file.id)} disabled={file.status === "uploading"}>
                    <Feather name="x" size={20} color="#555" />
                </TouchableOpacity>
              )}
            </View>
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
              opacity: uploading ? 0.7 : 1
            }}
            onPress={handleUploadBtn}
            disabled={pendingCount === 0 || uploading}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                {uploading ? "Uploading..." : (pendingCount > 0 ? `Upload ${pendingCount} file` : "Uploaded")}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <Navbar />
    </LinearGradient>
  );
};

export default Add;
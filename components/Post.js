import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const Post = ({ data }) => {
  // const [user, setUser] = useState(null);
  // const [postImages, setPostImages] = useState([]);
  
  // // State สำหรับควบคุม Gallery Modal
  // const [modalVisible, setModalVisible] = useState(false);
  // const [initialIndex, setInitialIndex] = useState(0);

  // const formatDate = (timestamp) => {
  //   if (!timestamp) return "";
  //   const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  //   return date.toLocaleDateString("th-TH") + " " + date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
  // };

  // useEffect(() => {
  //   const fetchPostData = async () => {
  //     if (!data) return;

  //     try {
  //       if (data.user_id) {
  //         const userQ = query(
  //           collection(db, "users"), 
  //           where("id", "==", data.user_id)
  //         );
  //         const userSnap = await getDocs(userQ);
  //         if (!userSnap.empty) {
  //           setUser(userSnap.docs[0].data());
  //         }
  //       }

  //       if (data.batch_id) {
  //         const imgQ = query(
  //           collection(db, "uploaded_images"),
  //           where("batch_id", "==", data.batch_id)
  //         );
  //         const imgSnap = await getDocs(imgQ);
  //         const imgs = imgSnap.docs.map(doc => doc.data());
  //         setPostImages(imgs);
  //       }

  //     } catch (error) {
  //       console.log("Error fetching post details:", error);
  //     }
  //   };

  //   fetchPostData();
  // }, [data]);

  // // ฟังก์ชันเปิด Gallery
  // const openGallery = (index) => {
  //   setInitialIndex(index);
  //   setModalVisible(true);
  // };

  // // ส่วนแสดงผลรูปภาพในหน้า Post ปกติ
  // const renderImages = () => {
  //   if (postImages.length === 0) return null;

  //   const imagesToShow = postImages.slice(0, 4);
  //   const remainingCount = postImages.length - 4;

  //   return (
  //     <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
  //       {imagesToShow.map((item, index) => (
  //         <TouchableOpacity 
  //           key={index} 
  //           style={{ width: width / 2, height: width / 2 }}
  //           activeOpacity={0.9}
  //           onPress={() => openGallery(index)} // กดเพื่อเปิด Gallery
  //         >
  //           <Image
  //             source={{ uri: item.image_path }} 
  //             style={{
  //               width: "100%", 
  //               height: "100%", 
  //               borderWidth: 0.5,
  //               borderColor: "#fff",
  //             }}
  //           />
  //           {index === 3 && remainingCount > 0 && (
  //             <View
  //               style={{
  //                 position: "absolute",
  //                 top: 0, left: 0, right: 0, bottom: 0,
  //                 backgroundColor: "rgba(0,0,0,0.5)",
  //                 justifyContent: "center",
  //                 alignItems: "center",
  //               }}
  //             >
  //               <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
  //                 +{remainingCount}
  //               </Text>
  //             </View>
  //           )}
  //         </TouchableOpacity>
  //       ))}
  //     </View>
  //   );
  // };

  // return (
  //   <View style={{ marginTop: 7 }}>
  //     {/* เส้นแบ่ง */}
  //     <View style={{ height: 1, backgroundColor: "#11A4E1", opacity: 0.2, width: "100%" }} />

  //     <View>
  //       {/* ส่วนหัวโพสต์ */}
  //       <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
  //         <Image
  //           source={{ uri: user?.avatar_url?.uri || user?.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhA_VuqI8DqCHBMlOg_Y6KMjEuJsX_prJX9g&s" }}
  //           style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee" }}
  //         />
  //         <View style={{ marginLeft: 10 }}>
  //           <Text style={{ fontWeight: "bold", fontSize: 16, color: "#000" }}>
  //             {user ? user.name : "Loading..."}
  //           </Text>
  //           <View style={{ flexDirection: "row", alignItems: "center" }}>
  //             <Text style={{ color: "gray", fontSize: 12 }}>
  //               {formatDate(data?.created_at)}
  //             </Text>
  //             <Text style={{ color: "gray", fontSize: 12, marginHorizontal: 4 }}>•</Text>
  //             <Text style={{ color: "gray", fontSize: 10 }}>🌍</Text>
  //           </View>
  //         </View>
  //       </View>

  //       {/* ข้อความ Note */}
  //       <Text style={{ paddingHorizontal: 12, marginBottom: 10, fontSize: 15, color: "#000" }}>
  //         {data?.note || ""}
  //       </Text>

  //       {/* รูปภาพ */}
  //       {renderImages()}
  //     </View>

  //     {/* --- Modal Gallery --- */}
  //     <Modal
  //       visible={modalVisible}
  //       transparent={true}
  //       animationType="fade"
  //       onRequestClose={() => setModalVisible(false)}
  //     >
  //       <SafeAreaView style={styles.modalContainer}>
  //         {/* ปุ่มปิด */}
  //         <TouchableOpacity 
  //           style={styles.closeButton} 
  //           onPress={() => setModalVisible(false)}
  //         >
  //           <Text style={styles.closeText}>✕ Close</Text>
  //         </TouchableOpacity>

  //         {/* รายการรูปภาพแบบเลื่อนดูได้ */}
  //         <FlatList
  //           data={postImages}
  //           horizontal
  //           pagingEnabled // ทำให้เลื่อนทีละรูป
  //           initialScrollIndex={initialIndex} // เริ่มต้นที่รูปที่กดมา
  //           onScrollToIndexFailed={() => {}} // ป้องกัน error ถ้า scroll เร็วไป
  //           showsHorizontalScrollIndicator={false}
  //           keyExtractor={(item, index) => index.toString()}
  //           renderItem={({ item }) => (
  //             <View style={{ width: width, height: height * 0.8, justifyContent: 'center' }}>
  //               <Image
  //                 source={{ uri: item.image_path }}
  //                 style={{ width: "100%", height: "100%" }}
  //                 resizeMode="contain" // แสดงรูปเต็มใบไม่โดนตัด
  //               />
  //             </View>
  //           )}
  //         />
  //       </SafeAreaView>
  //     </Modal>
  //   </View>
  // );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
  },
  closeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Post;
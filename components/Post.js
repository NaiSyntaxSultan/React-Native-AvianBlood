import React, { useState } from "react";
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
  // ✅ เพิ่มตรงนี้: ถ้าไม่มี data ส่งมา ให้จบการทำงานทันที ไม่ต้องแสดงผลอะไร
  if (!data) return null;

  const user = data?.user || {}; 
  const postImages = data?.uploaded_images || [];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    let date;
    
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("th-TH") + " " + date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
  };

  const openGallery = (index) => {
    setInitialIndex(index);
    setModalVisible(true);
  };

  const renderImages = () => {
    if (postImages.length === 0) return null;

    const imagesToShow = postImages.slice(0, 4);
    const remainingCount = postImages.length - 4;

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {imagesToShow.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={{ width: width / 2, height: width / 2 }}
            activeOpacity={0.9}
            onPress={() => openGallery(index)}
          >
            <Image
              source={{ uri: item.image_path }} 
              style={{
                width: "100%", 
                height: "100%", 
                borderWidth: 0.5,
                borderColor: "#fff",
              }}
            />
            {index === 3 && remainingCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
                  +{remainingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={{ marginTop: 7 }}>
      <View style={{ height: 1, backgroundColor: "#11A4E1", opacity: 0.2, width: "100%" }} />

      <View>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
          <Image
            source={{ uri: user.avatar_uri || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhA_VuqI8DqCHBMlOg_Y6KMjEuJsX_prJX9g&s" }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee" }}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "#000" }}>
              {user.name || "Unknown User"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "gray", fontSize: 12 }}>
                {formatDate(data?.created_at)}
              </Text>
              <Text style={{ color: "gray", fontSize: 12, marginHorizontal: 4 }}>•</Text>
              <Text style={{ color: "gray", fontSize: 10 }}>🌍</Text>
            </View>
          </View>
        </View>

        <Text style={{ paddingHorizontal: 12, marginBottom: 10, fontSize: 15, color: "#000" }}>
          {data?.note || ""}
        </Text>

        {renderImages()}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>

          <FlatList
            data={postImages}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            onScrollToIndexFailed={() => {}}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ width: width, height: height * 0.8, justifyContent: 'center' }}>
                <Image
                  source={{ uri: item.image_path }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
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
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Image,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";

import Navbar from "../components/Navbar";
import Post from "../components/Post";
const logo = require("../assets/logo1.png");

import {
  getLocalUser,
  getCachedPosts,
  saveCachedPosts,
} from "../services/sqlite-service";
import { readPost } from "../services/firebase-service";

const Home = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  const loadData = async () => {
    try {
      // 1. โหลดจาก SQLite มาแสดงก่อน (เพื่อให้เห็นข้อมูลเก่าทันที)
      const localPosts = await getCachedPosts();
      if (localPosts) {
        setPosts(localPosts);
      }

      // 2. เช็คเน็ต ถ้ามีเน็ต ให้ดึงจาก Firebase มา Sync
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const fetchedPosts = await readPost();
        
        // ✅ แก้ไขตรงนี้: ตรวจสอบแค่ว่าเป็น Array หรือไม่ (ไม่ต้องเช็ค length > 0)
        // เพื่อให้กรณีที่ลบข้อมูลหมดเกลี้ยง (fetchedPosts = []) ก็จะถูกบันทึกทับลงไป
        if (fetchedPosts) {
          setPosts(fetchedPosts);
          await saveCachedPosts(fetchedPosts); // ฟังก์ชันนี้จะล้างของเก่าและใส่ของใหม่ให้เอง
        }
      }
    } catch (error) {
      console.log("Load data error:", error);
    }
  };

  const checkUserAndFetch = async () => {
    setLoading(true);

    const user = await getLocalUser();

    if (user) {
      await loadData();
    } else {
      Alert.alert("เซสชันหมดอายุ", "โปรดเข้าสู่ระบบอีกครั้ง");
      navigation.replace("Login");
      return;
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    checkUserAndFetch();
  }, []);

  useEffect(() => {
    if (route.params?.refreshId) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      onRefresh();
    }
  }, [route.params?.refreshId]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator size="large" color="#11A4E1" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={50}
            tintColor="#11A4E1"
          />
        }
      >
        <View
          style={{
            height: 80,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#11A4E1" }}>
            Avain Blood
          </Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <Image
            source={logo}
            style={{ width: 48, height: 48, marginTop: 14, marginBottom: 14 }}
          />
          <Text>We bring intelligence to poultry diagnostics.</Text>
          <Text style={{ opacity: 0.5 }}>
            Detect abnormalities in seconds and enhance flock
          </Text>
          <Text style={{ opacity: 0.5 }}>
            health with advanced deep-learning analysis of
          </Text>
          <Text style={{ opacity: 0.5 }}>chicken blood cells.</Text>
        </View>

        {posts.map((item) => (
          <Post key={item.id} data={item} />
        ))}

        {posts.length === 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "gray" }}>
              กำลังโหลดข้อมูล หรือ ไม่มีโพสต์...
            </Text>
          </View>
        )}
      </ScrollView>

      <Navbar />
    </View>
  );
};

export default Home;
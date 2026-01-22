import React, { useState, useCallback, useEffect, useRef } from "react";
import { Image, Text, View, ScrollView, RefreshControl } from "react-native";
import { collection, query, orderBy, getDocs } from "firebase/firestore"; 
import { db } from "../config/firebase-config"; 

import Navbar from "../components/Navbar";
import Post from "../components/Post";
const logo = require("../assets/logo1.png");

const Home = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]); 
  const scrollViewRef = useRef(null);

  // ฟังก์ชันดึงข้อมูล Predictions
  const fetchPosts = async () => {
    try {
      const q = query(
        collection(db, "predictions"), 
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedPosts = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() });
      });
      setPosts(fetchedPosts);
    } catch (error) {
      console.log("Error fetching posts:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (route.params?.refreshId) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        onRefresh();
    }
  }, [route.params?.refreshId]);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: 'white' }} 
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

        {/* วนลูปแสดง Post ตามข้อมูลที่ได้จาก Predictions */}
        {posts.map((item) => (
          <Post key={item.id} data={item} />
        ))}

        {posts.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: 'gray' }}>กำลังโหลดข้อมูล หรือ ไม่มีโพสต์...</Text>
          </View>
        )}

      </ScrollView>

      <Navbar />
    </View>
  );
};

export default Home;
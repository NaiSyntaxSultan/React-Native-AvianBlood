import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const logo = require("../assets/logo1.png");

export default function HeaderBar({ title }) {
  const insets = useSafeAreaInsets();

  return ( 
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#ffffff" }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* พื้นขาวด้านซ้าย */}
        <View style={styles.leftWhite} />

        {/* สามเหลี่ยมตัดเฉียง */}
        <View style={styles.diagonalCut} />

        {/* โลโก้ */}
        <Image source={logo} style={styles.logo} />

        {/* Title */}
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    backgroundColor: "#8EC2D6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  /* ตัดมุมเฉียง */
  diagonalCut: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 130,
    height: 90,
    borderTopWidth: HEADER_HEIGHT,
    borderTopColor: "#ffffff",
    borderRightWidth: 50,/*ปรับเฉียง*/
    borderRightColor: "transparent",
    zIndex: 1,
  },

  logo: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 5,
  },

  title: {
    position: "absolute",
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    paddingHorizontal: 80, 
    zIndex: 10,
  },
});

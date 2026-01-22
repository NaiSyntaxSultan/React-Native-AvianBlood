import React, { useState, useEffect } from "react";
import {
  Button,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { myStyle } from "../styles/myStyle";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";

import { checkUser } from "../services/firebase-service";
import { saveLocalUser, getLocalUser } from "../services/sqlite-service";

const bg = require("../assets/login.png");

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ตรวจสอบว่าเคยล็อกอินค้างไว้ไหม
  useEffect(() => {
    const existingUser = getLocalUser();
    if (existingUser) {
      console.log("Checking Local User:", existingUser.name);
      navigation.replace("Home");
    }
  }, []);

  const hdlLogin = async () => {
    if (email === "" || password === "") {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const userData = await checkUser(email, password);

      if (userData) {
        console.log("Login Success, saving to SQLite...");
        const isSaved = saveLocalUser({
          name: userData.name || "",
          username: userData.username || "",
          email: userData.email,
          password: userData.password,
          phone_number: userData.phone_number || "",
          avatar_uri: userData.avatar_uri || "",
          role: userData.role || "user",
          firebase_id: userData.firebase_id,
          is_synced: 1,
        });

        if (isSaved) {
          Alert.alert("ยินดีต้อนรับ", "เข้าสู่ระบบสำเร็จ");
          setEmail("");
          setPassword("");
          navigation.replace("Home");
        } else {
          Alert.alert("Error", "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงเครื่อง");
        }
      } else {
        Alert.alert("ผิดพลาด", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{ flex: 1, paddingBottom: 30, backgroundColor: "white" }}
          >
            <View style={{ width: "100%" }}>
              <Image source={bg} style={{ width: "100%" }} resizeMode="cover" />
            </View>

            <Text style={myStyle.textheader}>Login</Text>

            <View style={{ marginTop: 40 }}>
              {/* Email */}
              <View style={myStyle.inputContainer}>
                <View style={myStyle.iconBox}>
                  <MaterialCommunityIcons
                    name="gmail"
                    size={27}
                    color="white"
                  />
                </View>

                <TextInput
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  style={myStyle.textInput}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={myStyle.inputContainer}>
                <View style={myStyle.iconBox}>
                  <MaterialCommunityIcons name="lock" size={27} color="white" />
                </View>

                <TextInput
                  placeholder="Enter password"
                  keyboardType="default"
                  secureTextEntry={!showPassword}
                  style={[myStyle.textInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowPassword(!showPassword)}
                  style={myStyle.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye" : "eye-off"}
                    size={24}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 20, width: 297, alignSelf: "center" }}>
              <Text style={{ alignSelf: "flex-end" }}>Forget password?</Text>
            </View>

            <TouchableOpacity
              style={{
                alignSelf: "center",
                width: 221,
                height: 43,
                backgroundColor: "#2196F3",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 20,
              }}
              onPress={() => hdlLogin()}
            >
              <Text
                style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
              >
                Login
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 20,
                width: "55%",
                alignSelf: "center",
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#8D8D8D" }}
              />
              <Text
                style={{ marginHorizontal: 10, color: "#8D8D8D", fontSize: 14 }}
              >
                or sign up with
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#8D8D8D" }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                marginTop: 16,
                alignSelf: "center",
                gap: 20,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 50,
                  backgroundColor: "#E4E4E4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="facebook"
                  size={40}
                  color={"#1877F2"}
                />
              </View>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 50,
                  backgroundColor: "#E4E4E4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AntDesign name="google" size={40} color="#DB4437" />
              </View>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 50,
                  backgroundColor: "#E4E4E4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesome5 name="line" size={40} color="#06C755" />
              </View>
            </View>

            <View style={{ marginTop: 30, alignSelf: "center" }}>
              <Text style={{ color: "#8D8D8D", fontSize: 16 }}>
                Don’t have an account ?{" "}
                <Text
                  style={{ color: "#3B82F6" }}
                  onPress={() => navigation.navigate("SignUp")}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

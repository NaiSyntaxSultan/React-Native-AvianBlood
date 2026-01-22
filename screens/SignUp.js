import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { myStyle } from "../styles/myStyle";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { createUser } from "../services/firebase-service";

const bg = require("../assets/signup.png");

const SignUp = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const hdlRegister = async () => {
    if (
      firstname === "" ||
      lastname === "" ||
      username === "" ||
      email === "" ||
      password === ""
    ) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const newUserData = {
      name: firstname + " " + lastname,
      username: username,
      email: email.trim().toLowerCase(),
      password: password,
      phone_number: "Enter your phone number",
      avatar_uri: "",
    };

    try {
      const result = await createUser(newUserData);

      if (result) {
        Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อย", [
          {
            text: "ตกลง",
            onPress: () => {
              setFirstname("");
              setLastname("");
              setUsername("");
              setEmail("");
              setPassword("");
              navigation.navigate("Login");
            },
          },
        ]);
      } else {
        Alert.alert("ผิดพลาด", "ไม่สามารถสมัครสมาชิกได้ (อีเมลอาจซ้ำ)");
      }
    } catch (err) {
      console.error(err);
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
          <View style={{ flex: 1, paddingBottom: 30 }}>
            <View style={{ width: "100%", position: "relative", height: 300 }}>
              <Image
                source={bg}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  backgroundColor: "#3C84C4",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.58,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 40,
                fontWeight: "bold",
                color: "#0F2C42",
                alignSelf: "center",
                marginTop: 12,
              }}
            >
              Sign up
            </Text>

            <View>
              {/* first name */}
              <View style={myStyle.inputContainer2}>
                <View style={myStyle.iconBox}>
                  <Ionicons name="person" size={27} color="white" />
                </View>
                <TextInput
                  placeholder="First name"
                  keyboardType="default"
                  style={myStyle.textInput}
                  value={firstname}
                  onChangeText={setFirstname}
                />
              </View>
              {/* last name */}
              <View style={myStyle.inputContainer2}>
                <View style={myStyle.iconBox}>
                  <Ionicons name="person" size={27} color="white" />
                </View>
                <TextInput
                  placeholder="Last name"
                  keyboardType="default"
                  style={myStyle.textInput}
                  value={lastname}
                  onChangeText={setLastname}
                />
              </View>
              {/* Username */}
              <View style={myStyle.inputContainer2}>
                <View style={myStyle.iconBox}>
                  <Ionicons name="person" size={27} color="white" />
                </View>
                <TextInput
                  placeholder="Username"
                  keyboardType="default"
                  style={myStyle.textInput}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
              {/* email */}
              <View style={myStyle.inputContainer2}>
                <View style={myStyle.iconBox}>
                  <MaterialCommunityIcons
                    name="gmail"
                    size={27}
                    color="white"
                  />
                </View>
                <TextInput
                  placeholder="Enter your email"
                  keyboardType="default"
                  style={myStyle.textInput}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {/* Password */}
              <View style={myStyle.inputContainer2}>
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
              <Text
                style={{ alignSelf: "flex-end" }}
                onPress={() => navigation.navigate("Login")}
              >
                Already have an account?
              </Text>
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
              onPress={() => hdlRegister()}
            >
              <Text
                style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

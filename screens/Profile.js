import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Navbar from '../components/Navbar';
import { myStyle } from '../styles/myStyle';
import TabBar from '../components/TabBar';

const logo = require('../assets/logo1.png');

export default function Profile({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  
  const [user, setUser] = useState({
    name: "Dr.Strange",
    username: "@dr.strangenajahahaha",
    email: "strange121@gmail.com",
    phone: "080-536-1415",
    password: "1423",
    avatar: { uri: "https://i.pravatar.cc/300" },
  });

  
  const [draft, setDraft] = useState(user);

  const startEdit = () => {
    setDraft(user);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(user);
    setIsEditing(false);
    setShowPassword(false);
  };

  const saveEdit = async () => {

    if (!draft.name.trim()) return Alert.alert("Error", "Name ห้ามว่าง");
    if (!draft.email.includes("@")) return Alert.alert("Error", "Email ไม่ถูกต้อง");

    setUser(draft); 

    setIsEditing(false);
    setShowPassword(false);
    Alert.alert("Success", "บันทึกข้อมูลเรียบร้อย");
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <TabBar text={"Profile"} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Profile Card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Image source={user.avatar} style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: "#ddd" }} />

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F2C42" }}>
                {user.name}
              </Text>
              <Text style={{ marginTop: 2, color: "#6b7280" }}>
                {user.username}
              </Text>

              {/* Buttons */}
              {!isEditing ? (
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-start",
                    backgroundColor: "#0F2C42",
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                  }}
                  onPress={startEdit}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#0F2C42",
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                    }}
                    onPress={saveEdit}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: "#E5E7EB",
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                    }}
                    onPress={cancelEdit}
                  >
                    <Text style={{ color: "#111827", fontWeight: "700" }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Fields text box */}
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <EditableField
            label="Name"
            value={isEditing ? draft.name : user.name}
            editable={isEditing}
            onChangeText={(t) => setDraft((p) => ({ ...p, name: t }))}
          />

          <EditableField
            label="Username"
            value={isEditing ? draft.username : user.username}
            editable={isEditing}
            onChangeText={(t) => setDraft((p) => ({ ...p, username: t }))}
          />

          <EditableField
            label="Email"
            value={isEditing ? draft.email : user.email}
            editable={isEditing}
            keyboardType="email-address"
            onChangeText={(t) => setDraft((p) => ({ ...p, email: t }))}
          />

          {/* Password + eye */}
          <Text style={{ marginTop: 14, marginBottom: 8, fontWeight: "700", color: "#111827" }}>
            Password
          </Text>
          <View style={{
            backgroundColor: "#F1F1F1",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            height: 48,
          }}>
            <TextInput
              style={{ flex: 1, color: isEditing ? "#111827" : "#6b7280" }}
              value={isEditing ? draft.password : "********"}
              editable={isEditing}
              secureTextEntry={!showPassword}
              onChangeText={(t) => setDraft((p) => ({ ...p, password: t }))}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <EditableField
            label="Phone number"
            value={isEditing ? draft.phone : user.phone}
            editable={isEditing}
            keyboardType="phone-pad"
            onChangeText={(t) => setDraft((p) => ({ ...p, phone: t }))}
          />
        </View>
      </ScrollView>

      <Navbar />
    </View>
  );
}

function EditableField({ label, value, editable, onChangeText, keyboardType = "default" }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ marginBottom: 8, fontWeight: "700", color: "#111827" }}>{label}</Text>
      <View style={{
        backgroundColor: "#F1F1F1",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        justifyContent: "center",
      }}>
        <TextInput
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={{ color: editable ? "#111827" : "#6b7280" }}
        />
      </View>
    </View>
  );
}

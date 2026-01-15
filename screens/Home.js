import React from "react";
import { Text, View } from "react-native";
import Navbar from "../components/Navbar";

const Home = ({ navigation }) => {
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Text>Hello</Text>

      <Navbar />
    </View>
  );
};

export default Home;

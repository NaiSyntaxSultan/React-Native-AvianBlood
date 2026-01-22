import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import Home from "./screens/Home";
import Welcome from "./screens/Welcome";
import Predict from "./screens/Predict";
import Add from "./screens/Add";
import History from "./screens/History";
import Profile from "./screens/Profile";

import { initDB } from "./services/sqlite-service"

const Stack = createNativeStackNavigator();

export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    console.log("Initializing Database...");
    initDB(); 
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false); 
    }, 3000);

    return () => clearTimeout(timer); 
  }, []);

  if (isShowSplash) {
    return <Welcome />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none', }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Predict" component={Predict} />
        <Stack.Screen name="Add" component={Add} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Profile" component={Profile} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

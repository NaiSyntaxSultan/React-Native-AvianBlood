import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { AntDesign, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons"; 
import { useNavigation, useNavigationState } from "@react-navigation/native"; 

const { width } = Dimensions.get('window');
const itemWidth = width / 5;

const Navbar = () => {
  const navigation = useNavigation();
  
  const currentRouteName = useNavigationState(state => 
    state?.routes[state.index]?.name ?? 'Home'
  );

  const renderTabItem = (label, routeName, IconComponent, iconName, iconSize) => {
    const isActive = currentRouteName === routeName;

    return (
      <TouchableOpacity 
        style={isActive ? styles.navItemActive : styles.navItem} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate(routeName)} 
      >
        <View style={isActive ? styles.activeCircle : styles.iconWrapper}>
          <IconComponent 
            name={iconName} 
            size={isActive ? 30 : iconSize} 
            color={isActive ? "#152B3C" : "#B0B0B0"} 
            style={isActive ? { marginTop: 2 } : {}}
          /> 
        </View>
        <Text style={isActive ? styles.textLabelActive : styles.textLabel}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        
        {renderTabItem("Home", "Home", Feather, "home", 28)}

        {renderTabItem("Predict", "Predict", FontAwesome5, "brain", 24)}

        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Add')}
        >
          <View style={styles.plusCircle}>
            <AntDesign name="plus" size={28} color="#3C84C4" />
          </View>
        </TouchableOpacity>

        {renderTabItem("History", "History", AntDesign, "history", 26)}

        {renderTabItem("Profile", "Profile", Ionicons, "person-outline", 26)}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#152B3C", 
    height: 90,
  },
  rowContainer: {
    flexDirection: "row",
    height: "100%",
  },
  navItem: {
    width: itemWidth, 
    justifyContent: "center", 
    alignItems: "center",     
  },
  navItemActive: {
    width: itemWidth,
    justifyContent: "flex-end", 
    alignItems: "center",       
    paddingBottom: 22,       
  },
  activeCircle: {
    backgroundColor: "white",
    width: 66, 
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    transform: [{ translateY: -15 }], 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  plusCircle: { 
    backgroundColor: "white",
    width: 50, 
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  iconWrapper: {
    marginBottom: 4, 
    height: 26, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  textLabel: {
    color: "#B0B0B0",
    fontSize: 11,
    fontWeight: "400",
  },
  textLabelActive: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  }
});

export default Navbar;
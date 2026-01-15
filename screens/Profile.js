import React from 'react'
import { Text, View } from 'react-native'
import Navbar from '../components/Navbar'

const Profile = () => {
  return (
    <View style={{ flex: 1, position: "relative" }}>
        <Text>
            Profile
        </Text>
        <Navbar />
    </View>
  )
}

export default Profile
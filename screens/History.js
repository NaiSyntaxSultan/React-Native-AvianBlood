import React from 'react'
import { Text, View } from 'react-native'
import Navbar from '../components/Navbar'

const History = () => {
  return (
    <View style={{ flex: 1, position: "relative" }}>
        <Text>
            History
        </Text>
        <Navbar />
    </View>
  )
}

export default History
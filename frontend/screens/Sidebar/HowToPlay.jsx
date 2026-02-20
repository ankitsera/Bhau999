import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import EmptyState from '../../components/EmptyState'
import ThemeHeader from '../../components/Header'

const HowToPlay = ({navigation}) => {
  return (
    <View style={styles.container}>
      <ThemeHeader title="How to Play" />
      <EmptyState message='How to Play video coming soon...'/>
    </View>
  )
}

export default HowToPlay

const styles = StyleSheet.create({
    container:{
      flex: 1,
    }
})
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import EmptyState from '../../components/EmptyState'
import ThemeHeader from '../../components/ThemeHeader'

const Notifications = ({navigation}) => {
  return (
    <View style={styles.container}>
      <ThemeHeader title="Notifications" />
      <EmptyState message='Notifications Not Found'/>
    </View>
  )
}

export default Notifications

const styles = StyleSheet.create({
    container:{
      flex: 1,
    }
})
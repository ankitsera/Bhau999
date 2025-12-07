import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import EmptyState from '../../components/EmptyState'
import GreenHeader from '../../components/GreenHeader'

const Notifications = ({navigation}) => {
  return (
    <View style={styles.container}>
      <GreenHeader title="Notifications" />
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
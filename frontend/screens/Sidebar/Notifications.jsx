import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import EmptyState from '../../components/EmptyState'

const Passbook = () => {
  return (
    <View style={styles.container}>
      <EmptyState message='Notifications Not Found'/>
    </View>
  )
}

export default Passbook

const styles = StyleSheet.create({
    container:{
      flex: 1,
    }
})
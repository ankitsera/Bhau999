import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import EmptyState from '../../components/EmptyState'
import GreenHeader from '../../components/GreenHeader'

const Passbook = ({navigation}) => {
  return (
    <View style={styles.container}>
      <GreenHeader title="Passbook" />
      <EmptyState message='Transaction Not Found'/>
    </View>
  )
}

export default Passbook

const styles = StyleSheet.create({
    container:{
      flex: 1,
    }
})
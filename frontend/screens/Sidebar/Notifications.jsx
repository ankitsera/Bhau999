import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/EmptyState'
import ThemeHeader from '../../components/ThemeHeader'

const Notifications = ({navigation}) => {
  const { t } = useTranslation(['screens', 'common']);
  
  return (
    <View style={styles.container}>
      <ThemeHeader title={t('screens:notifications')} />
      <EmptyState message={t('screens:notificationsNotFound')}/>
    </View>
  )
}

export default Notifications

const styles = StyleSheet.create({
    container:{
      flex: 1,
    }
})
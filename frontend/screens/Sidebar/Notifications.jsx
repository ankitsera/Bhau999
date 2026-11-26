// screens/Notifications/Notifications.jsx
import React, { useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';

import EmptyState from '../../components/EmptyState';
import ThemeHeader from '../../components/ThemeHeader';
import LoadingView from '../../components/LoadingView';
import { useTranslation } from 'react-i18next';
import { NotificationsContext } from '../../contexts/NotificationsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FONT } from '../../contexts/Themes';

const Notifications = ({ navigation }) => {
  const { t } = useTranslation('common');
  const { colors, isDarkMode } = useTheme();

  const {
    notifications,
    notificationsLoading,
    notificationsError,
    refreshNotifications,
  } = useContext(NotificationsContext);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications?.();
    setRefreshing(false);
  };

  const formatDate = datetime => {
    if (!datetime) return '';
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderNotificationItem = ({ item }) => (
    <View
      style={[
        styles.notificationCard,
        { backgroundColor: colors.surface, shadowColor: colors.text },
      ]}
    >
      <View style={[styles.iconContainer]}>
        <Image
          source={require('../../assets/Images/notification.webp')} // <-- replace with your real image
          style={styles.iconImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {item.message}
        </Text>

        <Text style={[styles.date, { color: colors.textTertiary }]}>
          {formatDate(item.datetime)}
        </Text>
      </View>
    </View>
  );

  const loading = notificationsLoading && notifications.length === 0;

  // error
  if (notificationsError && notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('notifications')} />
        <EmptyState message={notificationsError} />
      </View>
    );
  }

  // empty
  if (notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('notifications')} />
        <EmptyState message="Notifications Not Found" />
      </View>
    );
  }

  return (
    <LoadingView loading={loading}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('notifications')} />

        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>
    </LoadingView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: 12,
    paddingBottom: 18,
  },

  notificationCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',

    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  iconImage: {
    width: 26,
    height: 26,
  },

  contentContainer: {
    flex: 1,
  },

  title: {
    fontSize: FONT.body,
    fontWeight: '700',
    marginBottom: 6,
  },

  message: {
    fontSize: FONT.label,
    lineHeight: 19,
    marginBottom: 8,
  },

  date: {
    fontSize: 12,
    textAlign: 'right',
  },
});
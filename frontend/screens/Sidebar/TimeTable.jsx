import React, { useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import ThemeHeader from '../../components/ThemeHeader';
import EmptyState from '../../components/EmptyState';
import LoadingView from '../../components/LoadingView';
import { GameContext } from '../../contexts/GameContext';
import { useTheme } from '../../contexts/ThemeContext';

/** --- Row component --- */
const TimeRow = ({ gameName, openTime, closeTime }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.rowCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <Text style={[styles.cell, styles.gameName, { color: colors.text }]} numberOfLines={1}>
        {String(gameName || '').toUpperCase()}
      </Text>
      <Text style={[styles.cell, styles.timeText, { color: colors.text }]}>{openTime || '--:--'}</Text>
      <Text style={[styles.cell, styles.timeText, { color: colors.text }]}>{closeTime || '--:--'}</Text>
    </View>
  );
};

const ListHeader = ({ t }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.headerChip, { backgroundColor: colors.primary }]}>
      <Text style={[styles.headerText, { flex: 1.2 }]}>{t('games:game')} {t('common:name')}</Text>
      <Text style={[styles.headerText, { flex: 0.9 }]}>{t('games:openTime')}</Text>
      <Text style={[styles.headerText, { flex: 0.9, textAlign: 'right' }]}>
        {t('games:closeTime')}
      </Text>
    </View>
  );
};

const TimeTable = () => {
  const { t } = useTranslation(['games', 'common', 'screens']);
  const { colors } = useTheme();

  // ALL games api data
  const { allGamesUi, isLoadingAllGames, loadAllGames } =
    useContext(GameContext);

  useFocusEffect(
    useCallback(() => {
      // load when screen opens
      loadAllGames?.();
    }, [loadAllGames]),
  );

  const onRefresh = useCallback(async () => {
    await loadAllGames?.();
  }, [loadAllGames]);

  const renderItem = ({ item }) => (
    <TimeRow
      gameName={item?.gameName}
      openTime={item?.openTimeText}
      closeTime={item?.closeTimeText}
    />
  );

  const loading = isLoadingAllGames && (!allGamesUi || allGamesUi.length === 0);

  return (
    <LoadingView loading={loading}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('games:timeTable')} />

        {!allGamesUi || allGamesUi.length === 0 ? (
          <View style={styles.center}>
            <EmptyState text={t('games:noGamesFound')} />
          </View>
        ) : (
          <FlatList
          data={allGamesUi}
          keyExtractor={(it, i) => String(it?.gameName ?? i)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={() => <ListHeader t={t} />}
          ListHeaderComponentStyle={{ marginBottom: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={!!isLoadingAllGames}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
    </LoadingView>
  );
};

export default TimeTable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Top chip (column headers)
  headerChip: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  // Row card
  rowCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cell: { flex: 0.9 },
  gameName: {
    flex: 1.2,
    fontWeight: '800',
    fontSize: 16,
  },
  timeText: {
    fontSize: 15,
    textAlign: 'right',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
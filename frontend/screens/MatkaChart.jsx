import React, { useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import ThemeHeader from '../components/ThemeHeader';
import EmptyState from '../components/EmptyState';
import LoadingView from '../components/LoadingView';
import { GameContext } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';

const Row = ({ name, onPanel, t }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {String(name || '').toUpperCase()}
      </Text>

      <View style={styles.actions}>
        {/* Jodi removed */}
        <Pressable style={[styles.btn, { backgroundColor: colors.primary, shadowColor: colors.text }]} onPress={onPanel}>
          <Text style={styles.btnText}>{t('games:panel')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const MatkaChart = () => {
  const { t } = useTranslation(['games', 'common']);
  const { colors } = useTheme();

  const navigation = useNavigation();
  const { activeGamesUi, isLoadingActiveGames, loadActiveGames } =
    useContext(GameContext);

  useFocusEffect(
    useCallback(() => {
      // keep it fresh when user opens this screen
      loadActiveGames?.();
    }, [loadActiveGames]),
  );

  const list = useMemo(() => {
    const arr = Array.isArray(activeGamesUi) ? activeGamesUi : [];
    // simple sort A-Z
    return arr
      .slice()
      .sort((a, b) =>
        String(a?.gameName || '').localeCompare(String(b?.gameName || '')),
      );
  }, [activeGamesUi]);

  const onRefresh = useCallback(async () => {
    await loadActiveGames?.();
  }, [loadActiveGames]);

  const loading = isLoadingActiveGames && list.length === 0;

  return (
    <LoadingView loading={loading}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ThemeHeader title={t('games:gameChartList')} />

      <View style={styles.body}>
        <FlatList
            data={list}
            keyExtractor={(item, idx) => String(item?.gameName || idx)}
            renderItem={({ item }) => (
              <Row
                name={item?.gameName}
                onPanel={() =>
                  navigation.navigate('GameChartPanel', {
                    gameName: String(item?.gameName || '').toUpperCase(),
                  })
                }
                t={t}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={!!isLoadingActiveGames}
                onRefresh={onRefresh}
              />
            }
            ListEmptyComponent={<EmptyState text={t('games:noGamesFound')} />}
          />
      </View>
    </SafeAreaView>
    </LoadingView>
  );
};

export default MatkaChart;

const styles = StyleSheet.create({
  screen: { 
    flex: 1
  },
  body: { flex: 1 },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: { fontWeight: '700' },

  row: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  name: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    paddingRight: 10,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,

    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
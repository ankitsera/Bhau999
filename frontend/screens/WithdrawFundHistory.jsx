import React, {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import ThemeHeader from '../components/ThemeHeader';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import LoadingView from '../components/LoadingView';

import { AuthContext } from '../contexts/AuthContext';
import { PaymentsContext } from '../contexts/PaymentsContext';
import { useTheme } from '../contexts/ThemeContext';

import DateFilterRow, {
  matchesSingleDateFilter,
} from '../components/DateFilterRow';

const PAGE_SIZE = 10;

const parseTxDateTime = (txDate, txTime) => {
  if (!txDate) return null;
  const [y, m, d] = String(txDate).split('-').map(Number);
  if (![y, m, d].every(Number.isFinite)) return null;

  const rawTime = String(txTime || '00:00:00');
  const timePart = rawTime.split('.')[0];
  const [hh, mm, ss] = timePart.split(':').map(Number);

  return new Date(
    y,
    (m || 1) - 1,
    d || 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    Number.isFinite(ss) ? ss : 0,
  );
};

const formatDate = dt => {
  if (!(dt instanceof Date)) return '--';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${String(dt.getDate()).padStart(2, '0')} ${
    months[dt.getMonth()] || '--'
  } ${dt.getFullYear()}`;
};

const formatTime = dt => {
  if (!(dt instanceof Date)) return '--:--';
  let h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const makeKey = (x, idx) =>
  `${x?.id ?? 'noid'}_${x?.txDate ?? 'nod'}_${x?.txTime ?? 'not'}_${
    x?.amount ?? 'noa'
  }_${idx}`;

const isPending = s =>
  String(s || '')
    .toLowerCase()
    .includes('pend');
const isAccepted = s =>
  String(s || '')
    .toLowerCase()
    .match(/accept|approv/);
const isRejected = s =>
  String(s || '')
    .toLowerCase()
    .includes('reject');

const WithdrawCard = ({ item, primary, t }) => {
  const { colors } = useTheme();

  const id = item?.id ?? '--';
  const amountNum = Number(item?.amount || 0) || 0;
  const showAmt = Math.abs(amountNum);

  const status = item?.status ? String(item.status) : 'Pending';
  const remark = item?.remarks != null ? String(item.remarks) : '';
  const mode = item?.initiator ? String(item.initiator) : 'Admin';

  const dt = parseTxDateTime(item?.txDate, item?.txTime);

  const statusColor = isRejected(status)
    ? '#E53935'
    : isAccepted(status)
    ? '#3FA16C'
    : isPending(status)
    ? primary
    : colors.textTertiary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.text },
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.id, { color: statusColor }]} numberOfLines={1}>
          {id}
        </Text>
        <Text style={[styles.amt, { color: statusColor }]} numberOfLines={1}>
          ₹{showAmt}
        </Text>
      </View>

      <View style={styles.mid}>
        <Text style={[styles.text, { color: colors.text }]}>
          {t('funds:withdrawalBy')}: {mode}
        </Text>
        <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
      </View>

      {remark ? (
        <Text style={[styles.text, { color: colors.text }]}>
          {t('funds:remark')}: {remark}
        </Text>
      ) : null}

      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {formatDate(dt)} • {formatTime(dt)}
      </Text>
    </View>
  );
};

const WithdrawFundHistory = () => {
  const { t } = useTranslation(['funds', 'common', 'screens']);
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { withdrawals, isLoadingWithdrawals, loadWithdrawals } =
    useContext(PaymentsContext);

  const primary = colors.primary;

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // date filter modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // applied filter
  const [filters, setFilters] = useState({
    date: null,
  });

  // draft filter
  const [draft, setDraft] = useState({
    date: null,
  });

  const didFetchOnFocusRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!mobileNumber) return;
    await loadWithdrawals?.();
  }, [mobileNumber, loadWithdrawals]);

  useFocusEffect(
    useCallback(() => {
      if (!didFetchOnFocusRef.current) {
        didFetchOnFocusRef.current = true;
        fetchData();
      }
      return () => {
        didFetchOnFocusRef.current = false;
      };
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(withdrawals) ? withdrawals : [];
    return arr.slice().sort((a, b) => {
      const ta = parseTxDateTime(a?.txDate, a?.txTime)?.getTime?.() || 0;
      const tb = parseTxDateTime(b?.txDate, b?.txTime)?.getTime?.() || 0;
      if (ta !== tb) return tb - ta;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [withdrawals]);

  // apply date filter BEFORE pagination
  const filtered = useMemo(() => {
    const arr = Array.isArray(sorted) ? sorted : [];
    if (!(filters.date instanceof Date)) return arr;

    return arr.filter(it => {
      const dt = parseTxDateTime(it?.txDate, it?.txTime);
      return matchesSingleDateFilter(dt, filters.date);
    });
  }, [sorted, filters.date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const activeFilterCount = useMemo(() => {
    return filters.date instanceof Date ? 1 : 0;
  }, [filters.date]);

  const openFilter = useCallback(() => {
    setDraft({
      date: filters.date instanceof Date ? new Date(filters.date) : null,
    });
    setIsFilterOpen(true);
  }, [filters.date]);

  const closeFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const applyFilter = useCallback(() => {
    setFilters({
      date: draft.date instanceof Date ? new Date(draft.date) : null,
    });
    setIsFilterOpen(false);
    setPage(1);
  }, [draft.date]);

  const clearDraft = useCallback(() => {
    setDraft({ date: null });
  }, []);

  const clearAll = useCallback(() => {
    setFilters({ date: null });
    setPage(1);
  }, []);

  const loading = isLoadingWithdrawals && filtered.length === 0;

  return (
    <LoadingView loading={loading}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('funds:withdrawHistory')} />

        <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterBtn]}
          onPress={openFilter}
        >
          <View style={styles.filterBtnContent}>
            <MaterialCommunityIcons name="filter" size={30} color={colors.text} />
            {activeFilterCount ? (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.filterBadgeText, { color: colors.primary }]}
                >
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        {activeFilterCount ? (
          <Pressable
            style={[styles.clearBtn, { backgroundColor: colors.surface }]}
            onPress={clearAll}
          >
            <Text style={[styles.clearBtnText, { color: colors.text }]}>
              {t('screens:clear')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {filtered.length === 0 && !isLoadingWithdrawals ? (
        <EmptyState
          message={
            filters.date instanceof Date
              ? t('screens:noWithdrawHistoryFoundForDate')
              : t('screens:noWithdrawHistoryFound')
          }
        />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, idx) => makeKey(item, idx)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <WithdrawCard item={item} primary={primary} t={t} />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <PaginationBar
        page={`${safePage}/${totalPages}`}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => hasPrev && setPage(p => p - 1)}
        onNext={() => hasNext && setPage(p => p + 1)}
      />

      {/* Date Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFilter}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeFilter} />

        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <Text style={styles.modalHeaderText}>{t('common:filter')}</Text>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <DateFilterRow
              label={t('screens:byDate')}
              value={draft.date}
              onChange={date => setDraft(prev => ({ ...prev, date }))}
            />
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
            <Pressable
              style={[styles.footerBtnLeft, { backgroundColor: colors.primary }]}
              onPress={closeFilter}
            >
              <Text style={styles.footerBtnText}>{t('common:cancel')}</Text>
            </Pressable>

            <Pressable
              style={[styles.footerBtnMid, { backgroundColor: colors.primaryTile }]}
              onPress={clearDraft}
            >
              <Text style={styles.footerBtnText}>{t('screens:reset')}</Text>
            </Pressable>

            <Pressable
              style={[styles.footerBtnRight, { backgroundColor: colors.primary }]}
              onPress={applyFilter}
            >
              <Text style={styles.footerBtnText}>{t('common:filter')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
    </LoadingView>
  );
};

export default WithdrawFundHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontWeight: '700',
  },

  // filter bar
  filterBar: {
    position: 'absolute',
    top: 35,
    right: 25,
    zIndex: 10,
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 2,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  filterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  clearBtnText: {
    fontWeight: '900',
  },

  card: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },

  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: {
    fontSize: 16,
    fontWeight: '900',
  },
  amt: {
    fontSize: 16,
    fontWeight: '900',
  },

  mid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  text: {
    fontWeight: '800',
  },
  status: {
    fontWeight: '900',
  },

  date: {
    marginTop: 8,
    fontWeight: '800',
  },

  // modal styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    marginHorizontal: 14,
    marginTop: 70,
    marginBottom: 70,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxHeight: 520,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  footerBtnLeft: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnMid: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnRight: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: '900',
  },
});
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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import ThemeHeader from '../../components/ThemeHeader';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';

import { AuthContext } from '../../contexts/AuthContext';
import { PaymentsContext } from '../../contexts/PaymentsContext';
import { useTheme } from '../../contexts/ThemeContext';

import DateFilterRow, {
  matchesSingleDateFilter,
} from '../../components/DateFilterRow';

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
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
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

const PassbookRow = ({ item, GREEN }) => {
  const { colors } = useTheme();

  const amountNum = Number(item?.amount || 0) || 0;
  const isCredit = amountNum > 0;
  const dt = parseTxDateTime(item?.txDate, item?.txTime);

  const title =
    item?.remarks != null
      ? String(item.remarks)
      : item?.initiator
      ? `${isCredit ? 'Credit' : 'Debit'} By ${item.initiator}`
      : 'Transaction';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.text },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {formatDate(dt)} • {formatTime(dt)}
        </Text>
      </View>

      <Text
        style={[styles.amount, { color: isCredit ? GREEN : '#C62828' }]}
        numberOfLines={1}
      >
        {isCredit ? `+${Math.abs(amountNum)}` : `-${Math.abs(amountNum)}`}
      </Text>
    </View>
  );
};

const SummaryCard = ({ totalCredit, totalDebit, count }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: colors.surface, shadowColor: colors.text },
      ]}
    >
      <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
        Transaction Summary
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryIconCircle,
              { backgroundColor: '#E9FFF2' },
            ]}
          >
            <MaterialCommunityIcons name="arrow-down" size={20} color="#0E8F4D" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{totalCredit}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Total Credit
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryIconCircle,
              { backgroundColor: '#FFECEC' },
            ]}
          >
            <MaterialCommunityIcons name="arrow-up" size={20} color="#C62828" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{totalDebit}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Total Debit
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryIconCircle,
              { backgroundColor: colors.background },
            ]}
          >
            <MaterialCommunityIcons
              name="note-text-outline"
              size={26}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {count}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Transactions
          </Text>
        </View>
      </View>
    </View>
  );
};

const Chip = ({ label, active, onPress }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.text : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const Passbook = () => {
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { GREEN, transactions, isLoadingTransactions, loadTransactions } =
    useContext(PaymentsContext);

  const primary = colors.primary;

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // date filter modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // applied date filter
  const [filters, setFilters] = useState({
    date: null, // Date | null
  });

  // draft date filter inside modal
  const [draft, setDraft] = useState({
    date: null,
  });

  // NEW: chips filter (applies after date filter)
  const [tab, setTab] = useState('ALL'); // "ALL" | "CREDIT" | "DEBIT"

  const didFetchOnFocusRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!mobileNumber) return;
    await loadTransactions?.();
  }, [mobileNumber, loadTransactions]);

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
    const arr = Array.isArray(transactions) ? transactions : [];
    return arr.slice().sort((a, b) => {
      const ta = parseTxDateTime(a?.txDate, a?.txTime)?.getTime?.() || 0;
      const tb = parseTxDateTime(b?.txDate, b?.txTime)?.getTime?.() || 0;
      if (ta !== tb) return tb - ta;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [transactions]);

  // ✅ 1) date filter first
  const dateFiltered = useMemo(() => {
    const arr = Array.isArray(sorted) ? sorted : [];
    if (!(filters.date instanceof Date)) return arr;

    return arr.filter(it => {
      const dt = parseTxDateTime(it?.txDate, it?.txTime);
      return matchesSingleDateFilter(dt, filters.date);
    });
  }, [sorted, filters.date]);

  // ✅ summary computed from dateFiltered (so it updates with date selection)
  const summary = useMemo(() => {
    let credit = 0;
    let debit = 0;
    const arr = Array.isArray(dateFiltered) ? dateFiltered : [];

    for (let i = 0; i < arr.length; i++) {
      const amt = Number(arr[i]?.amount || 0) || 0;
      if (amt > 0) credit += amt;
      else if (amt < 0) debit += Math.abs(amt);
    }

    return {
      totalCredit: credit,
      totalDebit: debit,
      count: arr.length,
    };
  }, [dateFiltered]);

  // ✅ 2) chip filter next
  const filtered = useMemo(() => {
    const arr = Array.isArray(dateFiltered) ? dateFiltered : [];
    if (tab === 'CREDIT') return arr.filter(x => (Number(x?.amount || 0) || 0) > 0);
    if (tab === 'DEBIT') return arr.filter(x => (Number(x?.amount || 0) || 0) < 0);
    return arr;
  }, [dateFiltered, tab]);

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

  // badge count (date only)
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="Passbook" />

      {/* ✅ filter bar */}
      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterBtn, { backgroundColor: colors.primary }]}
          onPress={openFilter}
        >
          <View style={styles.filterBtnContent}>
            <MaterialCommunityIcons name="filter" size={30} color={colors.text} />
            {activeFilterCount ? (
              <View style={[styles.filterBadge, { backgroundColor: colors.background }]}>
                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
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
            <Text style={[styles.clearBtnText, { color: colors.text }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {/* fixed top content (summary + chips) */}
      <View style={styles.topWrap}>
        <SummaryCard
          totalCredit={summary.totalCredit}
          totalDebit={summary.totalDebit}
          count={summary.count}
        />

        <View style={styles.chipsRow}>
          <Chip
            label="All"
            active={tab === 'ALL'}
            onPress={() => {
              setTab('ALL');
              setPage(1);
            }}
          />
          <Chip
            label="Credit"
            active={tab === 'CREDIT'}
            onPress={() => {
              setTab('CREDIT');
              setPage(1);
            }}
          />
          <Chip
            label="Debit"
            active={tab === 'DEBIT'}
            onPress={() => {
              setTab('DEBIT');
              setPage(1);
            }}
          />
        </View>
      </View>

      {/* ✅ list */}
      {isLoadingTransactions && filtered.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={primary} />
          <Text style={[styles.loaderText, { color: colors.text }]}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            filters.date instanceof Date
              ? 'NO TRANSACTIONS FOUND FOR THIS DATE'
              : 'NO TRANSACTIONS FOUND'
          }
        />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, idx) => makeKey(item, idx)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <PassbookRow item={item} GREEN={GREEN} />}
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

      {/* Date Filter Modal (date only) */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFilter}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeFilter} />

        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <Text style={styles.modalHeaderText}>Filter Type</Text>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <DateFilterRow
              label="By Date"
              value={draft.date}
              onChange={date => setDraft(prev => ({ ...prev, date }))}
            />
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
            <Pressable
              style={[styles.footerBtnLeft, { backgroundColor: colors.primary }]}
              onPress={closeFilter}
            >
              <Text style={styles.footerBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.footerBtnMid, { backgroundColor: colors.primaryTile }]}
              onPress={clearDraft}
            >
              <Text style={styles.footerBtnText}>Reset</Text>
            </Pressable>

            <Pressable
              style={[styles.footerBtnRight, { backgroundColor: colors.primary }]}
              onPress={applyFilter}
            >
              <Text style={styles.footerBtnText}>Filter</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Passbook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // filter bar (same pattern)
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

  // top block (summary + chips)
  topWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  summaryCard: {
    borderRadius: 14,
    padding: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontWeight: '900',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontWeight: '900',
    fontSize: 18,
  },
  summaryLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 46,
    marginHorizontal: 10,
    opacity: 0.9,
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '900',
  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
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

  // row card
  card: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  left: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  sub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
  },

  // modal styles (kept same)
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
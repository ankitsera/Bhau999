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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ThemeHeader from '../components/ThemeHeader';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';

import { AuthContext } from '../contexts/AuthContext';
import { PaymentsContext } from '../contexts/PaymentsContext';
import { useTheme } from '../contexts/ThemeContext';

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

const Row = ({ label, value }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
};

const DepositCard = ({ item }) => {
  const { colors } = useTheme();

  const amountNum = Number(item?.amount || 0) || 0;
  const dt = parseTxDateTime(item?.txDate, item?.txTime);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
      <View style={[styles.cardTop, { backgroundColor: colors.primary }]}>
        <Text style={styles.cardTopLeft}>CREDIT</Text>
        <Text style={styles.cardTopRight}>₹{Math.abs(amountNum)}</Text>
      </View>

      <View style={styles.cardBody}>
        <Row label="Transaction ID:" value={String(item?.id ?? '--')} />
        <Row
          label="Status:"
          value={item?.status != null ? String(item.status) : 'SUCCESS'}
        />
        <Row
          label="Initiator:"
          value={item?.initiator != null ? String(item.initiator) : '--'}
        />
        <Row
          label="Remark:"
          value={
            item?.remarks != null
              ? String(item.remarks)
              : item?.initiator
              ? `Direct Credit By ${item.initiator}`
              : '--'
          }
        />
        <Row label="Date:" value={formatDate(dt)} />
        <Row label="Time:" value={formatTime(dt)} />
      </View>
    </View>
  );
};

const AddFundHistory = () => {
  const { colors } = useTheme();

  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { deposits, isLoadingDeposits, loadDeposits } =
    useContext(PaymentsContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const didFetchOnFocusRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!mobileNumber) return;
    await loadDeposits?.();
  }, [mobileNumber, loadDeposits]);

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
    const arr = Array.isArray(deposits) ? deposits : [];
    return arr.slice().sort((a, b) => {
      const ta = parseTxDateTime(a?.txDate, a?.txTime)?.getTime?.() || 0;
      const tb = parseTxDateTime(b?.txDate, b?.txTime)?.getTime?.() || 0;
      if (ta !== tb) return tb - ta;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [deposits]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title="Add Fund History" />

      {isLoadingDeposits && sorted.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.text }]}>Loading...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <EmptyState message="NO FUND HISTORY FOUND" />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, idx) => makeKey(item, idx)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <DepositCard item={item} />}
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
    </View>
  );
};

export default AddFundHistory;

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

  card: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },

  cardTop: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  cardTopRight: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },

  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  label: {
    fontWeight: '800',
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '900',
  },
});
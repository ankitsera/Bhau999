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

import GreenHeader from '../../components/GreenHeader';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';

import { AuthContext } from '../../contexts/AuthContext';
import { PaymentsContext } from '../../contexts/PaymentsContext';

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

const PassbookRow = ({ item, GREEN }) => {
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
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.sub}>
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

const Passbook = () => {
  const { user } = useContext(AuthContext);
  const mobileNumber = user?.mobileNumber;

  const { GREEN, transactions, isLoadingTransactions, loadTransactions } =
    useContext(PaymentsContext);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={styles.container}>
      <GreenHeader title="Passbook" />

      {isLoadingTransactions && sorted.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={GREEN} />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <EmptyState message="NO PASSBOOK FOUND" />
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
    </View>
  );
};

export default Passbook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
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
    color: '#111',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  left: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#666',
    fontSize: 16,
    fontWeight: '800',
  },
  sub: {
    marginTop: 6,
    color: '#777',
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
  },
});

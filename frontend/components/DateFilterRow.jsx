import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

const formatDatePretty = dt => {
  if (!(dt instanceof Date)) return '--';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dd = String(dt.getDate()).padStart(2, '0');
  const mon = months[dt.getMonth()] || '--';
  const yyyy = dt.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
};

const sameDay = (a, b) => {
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const matchesSingleDateFilter = (itemDate, selectedDate) => {
  // selectedDate null => no filter
  if (!(selectedDate instanceof Date)) return true;
  if (!(itemDate instanceof Date)) return false;
  return sameDay(itemDate, selectedDate);
};

const DateFilterRow = ({
  label = 'By Date',
  value, // Date | null
  onChange, // (Date|null) => void
}) => {
  const { t } = useTranslation(['common']);
  const [show, setShow] = useState(false);

  const displayText = useMemo(() => {
    return value instanceof Date ? formatDatePretty(value) : t('common:select');
  }, [value, t]);

  const openPicker = useCallback(() => setShow(true), []);
  const clear = useCallback(() => onChange?.(null), [onChange]);

  const onPick = useCallback(
    (event, selectedDate) => {
      const dismissed = event?.type === 'dismissed';

      // Android must manually close
      if (Platform.OS === 'android') setShow(false);

      if (dismissed) return;
      if (!(selectedDate instanceof Date)) return;

      onChange?.(selectedDate);

      // iOS: close for consistent UX
      if (Platform.OS !== 'android') setShow(false);
    },
    [onChange],
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>{label === 'By Date' ? t('common:byDate') : label}</Text>

      <View style={styles.row}>
        <Pressable style={styles.dateBtn} onPress={openPicker}>
          <Text style={styles.dateBtnText}>{displayText}</Text>
        </Pressable>

        {value instanceof Date ? (
          <Pressable style={styles.clearBtn} onPress={clear}>
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {show ? (
        <DateTimePicker
          value={value instanceof Date ? value : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPick}
        />
      ) : null}
    </View>
  );
};

export default DateFilterRow;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateBtnText: {
    fontWeight: '900',
    color: '#111',
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
  },
  clearText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginTop: -2,
  },
});
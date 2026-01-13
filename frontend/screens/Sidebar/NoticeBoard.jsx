import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import GreenHeader from '../../components/GreenHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyState from '../../components/EmptyState';
import {
  getNoticeBoard1,
  getNoticeBoard2,
  getNoticeBoard3,
  getNoticeBoard4,
  getNoticeBoard5,
} from '../../utils/AppConfigService';

const GREEN = '#3FA16C';

const Section = ({ title, points }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>

    {points?.length ? (
      points.map((p, idx) => (
        <View key={idx} style={styles.pointRow}>
          <MaterialCommunityIcons
            name="thumb-up-outline"
            size={18}
            color="#E39D05"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.pointText}>{p}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.sectionText}>No details available</Text>
    )}
  </View>
);

const NoticeBoard = () => {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);

  const loadNotices = async () => {
    try {
      setLoading(true);

      // NoticeBoard is non-critical, helpers return null when missing/empty
      const [n1, n2, n3, n4, n5] = await Promise.all([
        getNoticeBoard1(),
        getNoticeBoard2(),
        getNoticeBoard3(),
        getNoticeBoard4(),
        getNoticeBoard5(),
      ]);

      const list = [n1, n2, n3, n4, n5].filter(Boolean);
      setNotices(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // Keep UI same shape as before (sections with title + points[])
  const sections = useMemo(() => {
    if (!notices || notices.length === 0) return [];
    return [
      {
        title: 'Notices',
        points: notices,
      },
    ];
  }, [notices]);

  return (
    <View style={styles.container}>
      <GreenHeader title="Notice Board" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState icon="file-document-outline" message="NO NOTICES FOUND" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, idx) => (
            <React.Fragment key={idx}>
              <Section title={section.title} points={section.points} />
              {idx !== sections.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default NoticeBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#c0392b',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    textAlign: 'center',
    marginBottom: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  divider: {
    height: 2,
    backgroundColor: '#00000030',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#444',
    marginTop: 10,
  },
});
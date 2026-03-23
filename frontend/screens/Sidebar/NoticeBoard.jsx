import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ThemeHeader from '../../components/ThemeHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyState from '../../components/EmptyState';
import {
  getNoticeBoard1,
  getNoticeBoard2,
  getNoticeBoard3,
  getNoticeBoard4,
  getNoticeBoard5,
} from '../../utils/AppConfigService';
import { useTheme } from '../../contexts/ThemeContext';

const Section = ({ title, points, t }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

      <View style={[styles.ruleWrap, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text }]}>
        <View style={[styles.ruleTopLine, { backgroundColor: colors.text }]} />

        {points?.length ? (
          points.map((p, idx) => (
            <View key={idx} style={[styles.ruleRow, { borderBottomColor: colors.divider }]}>
              <View style={[styles.ruleIndex, { backgroundColor: colors.text }]}>
                <Text style={[styles.ruleIndexText, { color: colors.background }]}>{idx + 1}</Text>
              </View>

              <View style={styles.ruleTextWrap}>
                <Text style={[styles.pointText, { color: colors.text }]}>{p}</Text>
              </View>

              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={colors.textTertiary}
                style={{ marginLeft: 8, marginTop: 2 }}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{t('screens:noDetailsAvailable')}</Text>
        )}
      </View>
    </View>
  );
};

const NoticeBoard = () => {
  const { t } = useTranslation(['screens', 'games', 'common']);
  const { colors } = useTheme();

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
        title: t('screens:importantNotices'),
        points: notices,
      },
    ];
  }, [notices, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeHeader title={t('games:noticeBoardHeader')} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState icon="file-document-outline" message={t('screens:noNoticesFound')} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, idx) => (
            <React.Fragment key={idx}>
              <Section title={section.title} points={section.points} t={t} />
              {idx !== sections.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },

  ruleWrap: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  ruleTopLine: {
    height: 3,
    width: '100%',
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  ruleIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  ruleIndexText: {
    fontWeight: '900',
    fontSize: 13,
  },

  ruleTextWrap: {
    flex: 1,
  },
  pointText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'left',
  },

  sectionText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '700',
  },

  divider: {
    height: 2,
    marginVertical: 12,
  },
});
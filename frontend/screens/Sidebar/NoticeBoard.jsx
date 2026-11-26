import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ThemeHeader from '../../components/ThemeHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyState from '../../components/EmptyState';
import LoadingView from '../../components/LoadingView';
import {
  getNoticeBoard1,
  getNoticeBoard2,
  getNoticeBoard3,
  getNoticeBoard4,
  getNoticeBoard5,
  getWhatsappSupport,
} from '../../utils/AppConfigService';
import { useTheme } from '../../contexts/ThemeContext';
import { FONT } from '../../contexts/Themes';

const normalizePhoneDigits = value => String(value || '').replace(/\D/g, '');

const formatWhatsappNumber = value => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return '';
  if (digits.length === 10) return `+91 ${digits}`;
  return `+${digits}`;
};

const NoticeList = ({ title, points }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

      {points.map((point, index) => (
        <View key={`${index}-${point}`} style={styles.noticeRow}>
          <Text style={[styles.bullet, { color: colors.textTertiary }]}>•</Text>
          <Text style={[styles.pointText, { color: colors.textSecondary }]}>{point}</Text>
        </View>
      ))}
    </View>
  );
};

const NoticeBoard = () => {
  const { t } = useTranslation(['screens', 'games', 'common']);
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const loadNotices = async () => {
    try {
      setLoading(true);

      // NoticeBoard is non-critical, helpers return null when missing/empty
      const [n1, n2, n3, n4, n5, whatsapp] = await Promise.all([
        getNoticeBoard1(),
        getNoticeBoard2(),
        getNoticeBoard3(),
        getNoticeBoard4(),
        getNoticeBoard5(),
        getWhatsappSupport(),
      ]);

      const list = [n1, n2, n3, n4, n5].filter(Boolean);
      setNotices(list);
      setWhatsappPhone(String(whatsapp || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const sections = useMemo(() => {
    if (!notices || notices.length === 0) return [];
    return [
      {
        title: t('screens:importantNotices'),
        points: notices,
      },
    ];
  }, [notices, t]);

  const openWhatsapp = () => {
    const digits = normalizePhoneDigits(whatsappPhone);
    if (!digits) return;

    const number = digits.length === 10 ? `91${digits}` : digits;
    Linking.openURL(
      `https://wa.me/${number}?text=${encodeURIComponent(t('common:whatsappMessage'))}`,
    ).catch(() => {});
  };

  return (
    <LoadingView loading={loading}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemeHeader title={t('games:noticeBoardHeader')} />

        {sections.length === 0 ? (
          <EmptyState icon="file-document-outline" message={t('screens:noNoticesFound')} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!!whatsappPhone && (
              <Pressable
                accessibilityRole="button"
                onPress={openWhatsapp}
                style={({ pressed }) => [
                  styles.whatsappCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="whatsapp" size={36} color={colors.primary} />
                <Text style={[styles.whatsappNumber, { color: colors.text }]}>
                  {formatWhatsappNumber(whatsappPhone)}
                </Text>
              </Pressable>
            )}

            {sections.map((section, index) => (
              <NoticeList key={`${index}-${section.title}`} title={section.title} points={section.points} />
            ))}
          </ScrollView>
        )}
      </View>
    </LoadingView>
  );
};

export default NoticeBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  whatsappCard: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  whatsappNumber: {
    marginLeft: 12,
    fontSize: FONT.h3,
    fontWeight: '800',
  },

  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FONT.title,
    fontWeight: '800',
    marginBottom: 14,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingRight: 6,
  },
  bullet: {
    width: 24,
    fontSize: FONT.h3,
    lineHeight: 24,
    textAlign: 'center',
  },
  pointText: {
    flex: 1,
    fontSize: FONT.body,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'left',
  },
});

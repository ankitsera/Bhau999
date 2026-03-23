import React, { useEffect, useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  BackHandler,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function BlockedGate({ visible, navigationRef }) {
  const { t } = useTranslation(['auth', 'common']);
  const { clearSession } = useContext(AuthContext);
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  // ✅ Block Android back button while blocked
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  const goToUserCheck = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await clearSession?.();

      // Reset nav to UserCheck (works even outside navigator)
      navigationRef?.current?.reset?.({
        index: 0,
        routes: [{ name: 'UserCheck' }],
      });
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // do nothing
      }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth:accessBlocked')}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('auth:accountNotApprovedContactSupport')}
          </Text>

          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }, busy && styles.btnDisabled]}
            onPress={goToUserCheck}
          >
            <Text style={styles.btnText}>
              {busy ? t('common:opening') : t('auth:loginWithAnotherNumber')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 14,
  },

  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
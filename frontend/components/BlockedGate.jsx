import React, { useEffect, useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  BackHandler,
  Pressable,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeColor } from '../contexts/Themes';

export default function BlockedGate({ visible, navigationRef }) {
  const { clearSession } = useContext(AuthContext);
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
        <View style={styles.card}>
          <Text style={styles.title}>Access blocked</Text>
          <Text style={styles.body}>
            Your account is not approved yet. Please contact support.
          </Text>

          <Pressable
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={goToUserCheck}
          >
            <Text style={styles.btnText}>
              {busy ? 'Opening...' : 'Login with another number'}
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
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
    backgroundColor: ThemeColor,
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

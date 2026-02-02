import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
  NativeModules,
} from 'react-native';

const { UpdateModule } = NativeModules;

const GREEN = '#3FA16C';

export default function UpdateGate({ visible, compulsory, onDismiss, apkUrl }) {
  const [busy, setBusy] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);

  // Block back ONLY for compulsory update
  useEffect(() => {
    if (!visible || !compulsory) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible, compulsory]);

  const start = useCallback(async () => {
    if (busy) return;

    const url = String(apkUrl || '').trim();
    if (!url) {
      console.log('No APK url available (APK_URL missing in backend config)');
      return;
    }

    setBusy(true);
    try {
      setLastStatus(null);

      const status = await UpdateModule.startUpdate(url);
      setLastStatus(status);

      if (status === 'NEED_UNKNOWN_SOURCES') {
        // Settings opened, download NOT started yet
        setNeedsPermission(true);
        return; // do NOT dismiss
      }

      // Download started (or install opened)
      setNeedsPermission(false);

      // Optional update: dismiss only after download actually started
      if (!compulsory && status === 'DOWNLOADING') {
        onDismiss?.();
      }
    } catch (e) {
      console.log('Update failed:', e?.message);
    } finally {
      setBusy(false);
    }
  }, [busy, compulsory, onDismiss, apkUrl]);

  if (!visible) return null;

  const canDismiss = !compulsory;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (canDismiss) onDismiss?.();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {compulsory ? 'Update required' : 'Update available'}
          </Text>

          <Text style={styles.body}>
            {compulsory
              ? 'You must update to continue using the app.'
              : 'A new version is available. You can update now or later.'}
          </Text>

          {!String(apkUrl || '').trim() ? (
            <Text style={styles.note}>
              Update link is missing. Please try again later.
            </Text>
          ) : null}

          {needsPermission ? (
            <Text style={styles.note}>
              Please enable{' '}
              <Text style={styles.bold}>“Allow from this source”</Text> in
              Settings. After enabling, come back and tap{' '}
              <Text style={styles.bold}>Update now</Text> again.
            </Text>
          ) : null}

          {lastStatus === 'DOWNLOADING' ? (
            <Text style={styles.note}>
              Download started. When it finishes, the installer will open.
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.btn,
              (busy || !String(apkUrl || '').trim()) && styles.btnDisabled,
            ]}
            onPress={start}
          >
            <Text style={styles.btnText}>
              {busy ? 'Working...' : 'Update now'}
            </Text>
          </Pressable>

          {canDismiss && (
            <Pressable style={styles.laterBtn} onPress={() => onDismiss?.()}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          )}
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.9,
  },
  note: {
    fontSize: 12,
    marginBottom: 12,
    opacity: 0.8,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: GREEN,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: 'white',
    fontWeight: '800',
  },
  laterBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: '#fff',
  },
  laterText: {
    color: GREEN,
    fontWeight: '800',
  },
});
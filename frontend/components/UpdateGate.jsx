import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
  NativeModules,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const { UpdateModule } = NativeModules;

export default function UpdateGate({
  visible,
  compulsory,
  onDismiss,
  apkUrl,
  updateVersion,
}) {
  const { t } = useTranslation(['common']);
  const { colors } = useTheme();

  const [busy, setBusy] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [pollErrorCount, setPollErrorCount] = useState(0);
  const [pollStartTime, setPollStartTime] = useState(null);

  // block back only for compulsory update
  useEffect(() => {
    if (!visible || !compulsory) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible, compulsory]);

  // reset local state when modal closes
  useEffect(() => {
    if (!visible) {
      setBusy(false);
      setNeedsPermission(false);
      setLastStatus(null);
      setProgress(null);
      setPollErrorCount(0);
      setPollStartTime(null);
    }
  }, [visible]);

  const start = useCallback(async () => {
    const url = String(apkUrl || '').trim();
    if (!url) return;

    // prevent spamming
    if (busy) return;
    if (lastStatus === 'DOWNLOADING') return;

    setBusy(true);
    try {
      setProgress(null);
      setLastStatus(null);

      const version = updateVersion || '';
      const statusRaw = await UpdateModule.startUpdate(url, version);
      const status = String(statusRaw || '').trim();

      // normalize statuses
      if (status === 'ALREADY_DOWNLOADING') {
        setLastStatus('DOWNLOADING');
        return;
      }

      setLastStatus(status);

      if (status === 'NEED_UNKNOWN_SOURCES') {
        setNeedsPermission(true);
        return;
      }

      setNeedsPermission(false);
      // NOTE: don't auto-dismiss; user wanted to see progress + disabled state
    } catch (e) {
      console.log('Update failed:', e?.message);
    } finally {
      setBusy(false);
    }
  }, [apkUrl, updateVersion, busy, lastStatus]);

  // when user returns from settings, clear permission flag so they can try download
  useEffect(() => {
    if (!visible) return;

    const sub = AppState.addEventListener('change', async s => {
      if (s !== 'active') return;
      if (!needsPermission) return;

      //Clear the permission flag to allow user to retry download after returning from settings
      setNeedsPermission(false);
    });

    return () => sub.remove();
  }, [visible, needsPermission]);

  // poll progress while downloading
  useEffect(() => {
    if (!visible) return;

    let timer = null;
    const MAX_CONSECUTIVE_ERRORS = 5;
    const MAX_POLLING_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    if (
      lastStatus === 'DOWNLOADING' &&
      typeof UpdateModule.getDownloadProgress === 'function'
    ) {
      // Initialize poll start time on first poll
      if (!pollStartTime) {
        setPollStartTime(Date.now());
      }

      timer = setInterval(async () => {
        try {
          const res = await UpdateModule.getDownloadProgress();
          const st = String(res?.status || '');
          const pct = Number(res?.percent);

          // Reset error count on successful poll
          if (pollErrorCount > 0) {
            setPollErrorCount(0);
          }

          if (Number.isFinite(pct)) setProgress(pct);

          if (st === 'SUCCESS') {
            setProgress(100);
            setPollErrorCount(0);
            setPollStartTime(null);
            clearInterval(timer);
            timer = null;
            return;
          }

          if (st === 'FAILED' || st === 'NOT_FOUND') {
            // allow user to retry
            setLastStatus(null);
            setProgress(null);
            setPollErrorCount(0);
            setPollStartTime(null);
            clearInterval(timer);
            timer = null;
          }
        } catch (e) {
          // Increment error count and check limits
          const newErrorCount = pollErrorCount + 1;
          setPollErrorCount(newErrorCount);

          console.warn(`Download progress poll error (${newErrorCount}/${MAX_CONSECUTIVE_ERRORS}):`, e?.message);

          // Stop polling after too many consecutive errors
          if (newErrorCount >= MAX_CONSECUTIVE_ERRORS) {
            console.error('Max polling errors reached, stopping download polling');
            setLastStatus(null);
            setProgress(null);
            setPollErrorCount(0);
            setPollStartTime(null);
            clearInterval(timer);
            timer = null;
            return;
          }

          // Stop polling after timeout duration
          const now = Date.now();
          if (pollStartTime && (now - pollStartTime) > MAX_POLLING_DURATION_MS) {
            console.error('Polling timeout reached, stopping download polling');
            setLastStatus(null);
            setProgress(null);
            setPollErrorCount(0);
            setPollStartTime(null);
            clearInterval(timer);
            timer = null;
            return;
          }
        }
      }, 700);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, lastStatus, pollErrorCount, pollStartTime]);

  if (!visible) return null;

  const hasUrl = !!String(apkUrl || '').trim();
  const canDismiss = !compulsory;

  const isDownloading = lastStatus === 'DOWNLOADING';
  const disableUpdate = !hasUrl || busy || isDownloading;

  let updateBtnLabel = t('common:updateNow');
  if (!hasUrl) updateBtnLabel = t('common:linkMissing');
  else if (needsPermission) updateBtnLabel = t('common:enablePermission');
  else if (isDownloading) {
    updateBtnLabel =
      progress === null ? t('common:downloading') : `${t('common:downloading')} ${progress}%`;
  } else if (busy) updateBtnLabel = t('common:starting');

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {compulsory ? t('common:updateRequired') : t('common:updateAvailable')}
          </Text>

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {compulsory
              ? t('common:mustUpdateToContinue')
              : t('common:newVersionAvailable')}
          </Text>

          {!hasUrl ? (
            <Text style={[styles.note, { color: colors.textTertiary }]}>
              {t('common:updateLinkMissing')}
            </Text>
          ) : null}

          {needsPermission ? (
            <Text style={[styles.note, { color: colors.textTertiary }]}>
              {t('common:enableAllowFromThisSource')}
            </Text>
          ) : null}

          {isDownloading ? (
            <Text style={[styles.note, { color: colors.textTertiary }]}>
              {t('common:downloadingInBackground')}
            </Text>
          ) : null}

          {canDismiss ? (
            <View style={styles.row}>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnHalf,
                  { backgroundColor: colors.primary },
                  disableUpdate && styles.btnDisabled,
                ]}
                onPress={start}
              >
                <Text style={[styles.btnText, { color: colors.text || '#fff' }]}>
                  {updateBtnLabel}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.laterBtn,
                  styles.btnHalf,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.surface,
                  },
                  isDownloading && styles.btnDisabled,
                ]}
                onPress={() => {
                  // if downloading, don't allow dismiss (keeps UI clear)
                  if (isDownloading) return;
                  onDismiss?.();
                }}
              >
                <Text style={[styles.laterText, { color: colors.text }]}>
                  {t('common:later')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[
                styles.btn,
                { backgroundColor: colors.primary },
                disableUpdate && styles.btnDisabled,
              ]}
              onPress={start}
            >
              <Text style={[styles.btnText, { color: colors.text || '#fff' }]}>
                {updateBtnLabel}
              </Text>
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnHalf: {
    flex: 1,
  },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontWeight: '800',
  },

  laterBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  laterText: {
    fontWeight: '800',
  },
});
import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import ThemeHeader from '../../components/Header';

const APK_URL = 'http://admina1online.cloud/apk/app-release.apk';

export default function ShareApp({ navigation }) {
  const onShare = async () => {
    try {
      const message =
        `Download the latest SARA777 app here:\n${APK_URL}\n\n` +
        `If it asks, allow "Install unknown apps" and then install.`;

      await Share.share({ message });
    } catch (e) {
      Alert.alert('Share failed', e?.message || 'Something went wrong');
    }
  };

  const onCopy = () => {
    Clipboard.setString(APK_URL);
    Alert.alert('Copied', 'Download link copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <ThemeHeader title="Share App" />
      <Text style={styles.sub}>
        Send the download link on WhatsApp / Telegram / anywhere.
      </Text>

      <View style={styles.card}>
        <Text style={styles.link} numberOfLines={2}>
          {APK_URL}
        </Text>

        <Pressable style={styles.btn} onPress={onShare}>
          <Text style={styles.btnText}>Share</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.ghost]} onPress={onCopy}>
          <Text style={[styles.btnText, styles.ghostText]}>Copy Link</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sub: {
    marginTop: 15,
    fontSize: 14,
    opacity: 0.75,
    marginHorizontal: 20,
  },
  card: {
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3FA16C',
    marginBottom: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  ghost: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3FA16C',
  },
  ghostText: {
    color: '#3FA16C',
  },
});

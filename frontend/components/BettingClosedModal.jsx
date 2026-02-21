import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const RED = '#EF4B3E';

const BettingClosedModal = ({ visible, onClose }) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={28} color={colors.textTertiary} />
          </Pressable>

          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="close" size={46} color={RED} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.error }]}>Sorry !</Text>
          <Text style={[styles.msg, { color: colors.textSecondary }]}>
            Betting is Closed for today.{'\n'}Please come next day to play.
          </Text>

          <Pressable onPress={onClose} style={[styles.okBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.okText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default BettingClosedModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  iconWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  msg: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  okBtn: {
    marginTop: 18,
    width: '75%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  okText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
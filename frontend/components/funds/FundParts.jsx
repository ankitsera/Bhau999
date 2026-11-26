import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

// Shared building blocks for the Add Fund and Withdraw Fund screens.

const formatMobile = (m) => {
  const d = String(m || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d}` : d;
};

/** Green card with the user's initial, name, mobile and two value tiles. */
export const AccountCard = ({ user, tiles }) => {
  const { colors } = useTheme();
  const userName = user?.username || user?.name || '';
  const initial = (userName || 'U').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.accountCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
      <View style={styles.accountRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.accountInfo}>
          {!!userName && (
            <Text style={styles.accountName} numberOfLines={1}>
              {userName}
            </Text>
          )}
          <Text style={styles.accountMobile} numberOfLines={1}>
            {formatMobile(user?.mobileNumber)}
          </Text>
        </View>
      </View>

      <View style={styles.tilesRow}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tile}>
            <Text style={styles.tileLabel} numberOfLines={1}>
              {tile.label}
            </Text>
            <Text style={styles.tileValue} numberOfLines={1}>
              {tile.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const SectionLabel = ({ children }) => {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>;
};

/** Rounded amount field with a ₹ badge. Only digits are kept. */
export const AmountInput = ({ value, onChange, editable = true }) => {
  const { t } = useTranslation(['screens']);
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.amountInputWrap,
        { borderColor: value ? colors.primary : colors.cardBorder, backgroundColor: colors.surface },
      ]}
    >
      <View style={[styles.rupeeIcon, { backgroundColor: colors.primaryIconBg }]}>
        <Text style={[styles.rupeeText, { color: colors.primary }]}>₹</Text>
      </View>
      <TextInput
        placeholder={t('screens:enterAmount')}
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
        style={[styles.amountInput, { color: colors.text }]}
        value={value}
        onChangeText={(v) => onChange(String(v || '').replace(/[^0-9]/g, ''))}
        editable={editable}
        maxLength={7}
      />
    </View>
  );
};

/** Full-width primary action with a busy state. */
export const PrimaryButton = ({ label, onPress, disabled, busy, Loader }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: colors.primary }, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {busy && Loader ? <Loader size={22} /> : <Text style={[styles.primaryText, { color: colors.onPrimary }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

/** "For fund queries" with small Call / WhatsApp buttons. */
export const HelpRow = ({ onCall, onWhatsapp }) => {
  const { t } = useTranslation(['screens', 'common']);
  const { colors } = useTheme();
  const btn = [styles.helpBtn, { borderColor: colors.cardBorder, backgroundColor: colors.surface }];

  return (
    <>
      <Text style={[styles.helpTitle, { color: colors.textTertiary }]}>{t('screens:forFundQueries')}</Text>
      <View style={styles.helpBtns}>
        <TouchableOpacity style={btn} onPress={onCall} activeOpacity={0.8}>
          <MaterialIcons name="call" size={16} color={colors.text} />
          <Text style={[styles.helpText, { color: colors.text }]}>{t('common:call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={btn} onPress={onWhatsapp} activeOpacity={0.8}>
          <MaterialCommunityIcons name="whatsapp" size={16} color="#1FAF38" />
          <Text style={[styles.helpText, { color: colors.text }]}>{t('common:whatsapp')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export const fundStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

const styles = StyleSheet.create({
  // account card
  accountCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accountMobile: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 1,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tileLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  tileValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },

  // amount
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 22,
    marginBottom: 10,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 26,
    paddingHorizontal: 9,
  },
  rupeeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    paddingVertical: 0,
  },

  // primary button
  primaryBtn: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // help
  helpTitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 22,
  },
  helpBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

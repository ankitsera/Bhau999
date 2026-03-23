import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../contexts/ThemeContext";

const PasswordInput = forwardRef(
  (
    {
      placeholder = "Password",
      value,
      onChangeText,
      containerStyle,
      inputStyle,
      leftIconName = "lock-outline",
      showEyeWhen = "focusedOrHasText", // "focused" | "always" | "focusedOrHasText"
      returnKeyType = "done",
      onSubmitEditing,
      testID,
    },
    ref
  ) => {
    const { t } = useTranslation(['auth']);
    const { colors } = useTheme();

    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef?.current?.focus?.(),
    }));

    const inputRef = React.useRef(null);

    const shouldShowEye =
      showEyeWhen === "always"
        ? true
        : showEyeWhen === "focused"
        ? focused
        : focused || (value?.length ?? 0) > 0;

    return (
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surface, shadowColor: colors.text },
          focused && [styles.inputFocused, { borderColor: colors.primary }],
          containerStyle,
        ]}
      >
        <MaterialCommunityIcons name={leftIconName} size={22} color={colors.primary} style={styles.leftIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }, inputStyle]}
          placeholder={placeholder === "Password" ? t('auth:password') : placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          testID={testID}
        />
        {shouldShowEye && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={visible ? t('auth:hidePassword') : t('auth:showPassword')}
          >
            <MaterialCommunityIcons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

export default PasswordInput;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,

    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  inputFocused: {
    borderWidth: 1,
  },
  leftIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    paddingRight: 8,
  },
});
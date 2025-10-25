import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const PasswordInput = forwardRef(
  (
    {
      placeholder = "Password",
      value,
      onChangeText,
      containerStyle,
      inputStyle,
      leftIconName = "lock-closed-outline",
      showEyeWhen = "focusedOrHasText", // "focused" | "always" | "focusedOrHasText"
      returnKeyType = "done",
      onSubmitEditing,
      testID,
    },
    ref
  ) => {
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
      <View style={[styles.inputContainer, focused && styles.inputFocused, containerStyle]}>
        <Icon name={leftIconName} size={22} color="#00A86B" style={styles.leftIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#777"
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
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <Icon name={visible ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
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
    backgroundColor: "#F4F4F4",
    width: "85%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,

    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  inputFocused: {
    borderWidth: 1,
    borderColor: "#00A86B",
  },
  leftIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingRight: 8,
  },
});
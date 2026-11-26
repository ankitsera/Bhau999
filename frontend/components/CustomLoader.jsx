import React from 'react';
import { ActivityIndicator, View, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const CustomLoader = ({ visible = false, transparent = true }) => {
  const { colors } = useTheme();

  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.container,
          {
            opacity: visible ? 1 : 0,
          },
        ]}
      >
        <View
          style={[
            styles.loaderCircle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loaderCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomLoader;

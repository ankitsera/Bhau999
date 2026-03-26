import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

const CustomLoader = ({ visible = false, transparent = true }) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.loaderBox}>
          <LottieView
            source={require('../assets/loader.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
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
  loaderBox: {
    width: 60,
    height: 60,
  },
  lottie: {
    width: 60,
    height: 60,
  },
});

export default CustomLoader;
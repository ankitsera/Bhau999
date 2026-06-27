import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

const CustomLoader = ({ visible = false, transparent = true }) => {
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
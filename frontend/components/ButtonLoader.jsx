import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const ButtonLoader = ({ size = 24, color = '#fff' }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require('../assets/loader.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});

export default ButtonLoader;

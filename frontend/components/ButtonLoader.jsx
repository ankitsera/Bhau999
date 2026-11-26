import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const ButtonLoader = ({ size = 24, color = '#fff' }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ActivityIndicator
        size={size > 24 ? 'large' : 'small'}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ButtonLoader;

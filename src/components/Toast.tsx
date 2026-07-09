import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useApp } from '../store';
import { colors, fonts, radius } from '../theme';

const toneColor = (tone: 'gold' | 'green' | 'red' | 'orange'): string =>
  tone === 'green' ? colors.green : tone === 'red' ? colors.red : tone === 'orange' ? colors.orange : colors.gold;

export const Toast: React.FC = () => {
  const toast = useApp(s => s.toast);
  const setToast = useApp(s => s.setToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(offset, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(offset, { toValue: 20, duration: 220, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2400);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!toast) return null;
  const c = toneColor(toast.tone);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', bottom: 110, right: 20, left: 20,
        opacity,
        transform: [{ translateY: offset }],
        zIndex: 9999,
      }}
    >
      <View style={{
        backgroundColor: colors.bg2,
        borderColor: c,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <Text style={{ color: c, fontFamily: fonts.sansSemiBold, fontSize: 13 }}>{toast.text}</Text>
      </View>
    </Animated.View>
  );
};

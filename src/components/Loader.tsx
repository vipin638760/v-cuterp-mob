import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

interface LoaderProps {
  caption?: string;
  fullscreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ caption = 'LOADING', fullscreen = false }) => {
  const anims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(a, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(140),
        ])
      )
    );
    stagger.forEach(s => s.start());

    const pl = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pl.start();
    return () => { stagger.forEach(s => s.stop()); pl.stop(); };
  }, []);

  const content = (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <Animated.Text style={{
        fontFamily: fonts.script,
        fontSize: 88,
        color: colors.gold,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
        textShadowColor: 'rgba(212,165,116,0.6)',
        textShadowRadius: 24,
      }}>V</Animated.Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={{
            width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold,
            transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          }} />
        ))}
      </View>
      <Text style={{
        fontFamily: fonts.sansBold,
        color: colors.text3,
        fontSize: 11,
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>{caption}</Text>
    </View>
  );

  if (fullscreen) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </View>
    );
  }
  return content;
};

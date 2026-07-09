import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
  height?: number | 'auto';
}

export const Sheet: React.FC<SheetProps> = ({ open, title, onClose, children, height = 'auto' }) => {
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get('window').height;
  const tx = useRef(new Animated.Value(screenH)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(tx, { toValue: 0, duration: 260, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
        Animated.timing(overlayOp, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tx, { toValue: screenH, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(overlayOp, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', opacity: overlayOp }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: colors.bg2,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        borderTopWidth: 1, borderColor: colors.line2,
        paddingBottom: insets.bottom + 12,
        maxHeight: '90%',
        transform: [{ translateY: tx }],
        shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.6, shadowRadius: 80, elevation: 24,
      }}>
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.bg5 }} />
        </View>
        {title !== undefined && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
            borderBottomWidth: 1, borderColor: colors.line,
          }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={{ padding: 6 }}>
              <Icon name="x" size={20} color={colors.text2} />
            </Pressable>
          </View>
        )}
        {children}
      </Animated.View>
    </Modal>
  );
};

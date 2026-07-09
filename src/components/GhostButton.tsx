import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Icon, IconName } from './Icon';

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: 'default' | 'danger';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const GhostButton: React.FC<GhostButtonProps> = ({ label, onPress, icon, tone = 'default', style, fullWidth }) => {
  const fg = tone === 'danger' ? colors.red : colors.text2;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        backgroundColor: pressed ? colors.bg4 : colors.bg3,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.line2,
        minHeight: 44,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={16} color={fg} />}
        <Text style={{
          color: fg,
          fontFamily: fonts.sansBold,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}>{label}</Text>
      </View>
    </Pressable>
  );
};

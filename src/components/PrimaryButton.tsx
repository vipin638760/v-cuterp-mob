import React from 'react';
import { Pressable, Text, View, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Icon, IconName } from './Icon';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, onPress, icon, loading, disabled, style, fullWidth }) => (
  <Pressable
    onPress={onPress}
    disabled={loading || disabled}
    style={({ pressed }) => [{
      backgroundColor: pressed && !disabled ? colors.goldBright : colors.gold,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      opacity: disabled ? 0.5 : 1,
      alignSelf: fullWidth ? 'stretch' : 'auto',
    }, style]}
  >
    {loading ? <ActivityIndicator color={colors.bg} /> : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={16} color={colors.bg} strokeWidth={2} />}
        <Text style={{
          color: colors.bg,
          fontFamily: fonts.sansBold,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>{label}</Text>
      </View>
    )}
  </Pressable>
);

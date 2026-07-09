import React from 'react';
import { Text, TextInput, View, ViewStyle, TextInputProps } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ label, hint, rightIcon, containerStyle, error, style, ...rest }) => (
  <View style={[{ gap: 6 }, containerStyle]}>
    {label && (
      <Text style={{
        fontFamily: fonts.sansBold,
        fontSize: 9,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: colors.text3,
      }}>{label}</Text>
    )}
    <View style={{
      backgroundColor: colors.bg3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: error ? colors.red : colors.line2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      minHeight: 44,
    }}>
      <TextInput
        placeholderTextColor={colors.text4}
        selectionColor={colors.gold}
        style={[{
          flex: 1,
          fontFamily: fonts.sansMedium,
          color: colors.text,
          fontSize: 14,
          paddingVertical: 10,
        }, style]}
        {...rest}
      />
      {rightIcon}
    </View>
    {(hint || error) && (
      <Text style={{
        fontFamily: fonts.sansMedium,
        fontSize: 11,
        color: error ? colors.red : colors.text3,
      }}>{error || hint}</Text>
    )}
  </View>
);

import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { colors, radius } from '../theme';

interface ListCardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  padding?: number;
}

export const ListCard: React.FC<ListCardProps> = ({ style, children, padding = 14, ...rest }) => (
  <View
    {...rest}
    style={[
      {
        backgroundColor: colors.bg2,
        borderRadius: radius.lg,
        padding,
        borderWidth: 1,
        borderColor: colors.line,
      },
      style as any,
    ]}
  >
    {children}
  </View>
);

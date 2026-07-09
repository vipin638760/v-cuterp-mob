import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Icon, IconName } from './Icon';
import { useApp, currentScreen, Screen } from '../store';
import type { Role } from '../lib/types';

interface Tab {
  id: string;
  icon: IconName;
  label: string;
  target: Screen;
}

const tabsForRole = (role: Role): Tab[] => {
  if (role === 'employee') {
    return [
      { id: 'home', icon: 'home', label: 'Home', target: 'dashboard' },
      { id: 'day', icon: 'wallet', label: 'Day', target: 'day-working' },
      { id: 'target', icon: 'trending', label: 'Target', target: 'my-target' },
      { id: 'pay', icon: 'users', label: 'Payroll', target: 'my-payroll' },
    ];
  }
  return [
    { id: 'home', icon: 'home', label: 'Home', target: 'dashboard' },
    { id: 'pos', icon: 'wallet', label: 'POS', target: 'pos' },
    { id: 'insights', icon: 'trending', label: 'Insights', target: role === 'admin' ? 'pl' : 'branches' },
    { id: 'people', icon: 'users', label: 'People', target: 'staff' },
  ];
};

export const BottomNav: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useApp(s => s.user);
  const screen = useApp(currentScreen);
  const replace = useApp(s => s.replace);
  const push = useApp(s => s.push);
  if (!user) return null;
  const tabs = tabsForRole(user.role);

  return (
    <View style={{
      paddingBottom: Math.max(insets.bottom, 8),
      backgroundColor: colors.bg2,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    }}>
      <View style={{ flexDirection: 'row', height: 64 }}>
        {tabs.map(tab => {
          const active = tab.target === screen;
          return (
            <Pressable
              key={tab.id}
              onPress={() => active ? null : (tab.target === 'dashboard' ? replace(tab.target) : push(tab.target))}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              {active && (
                <View style={{
                  position: 'absolute', top: 8,
                  width: 28, height: 3,
                  borderRadius: radius.sm,
                  backgroundColor: colors.gold,
                }} />
              )}
              <Icon name={tab.icon} size={22} color={active ? colors.gold : colors.text3} />
              <Text style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: 9,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: active ? colors.gold : colors.text3,
              }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
